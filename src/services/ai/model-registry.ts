/**
 * @what OpenRouter model registry with caching and provider grouping
 *
 * Fetches available models from OpenRouter's public API,
 * groups them by provider, and caches results for 1 hour.
 * Falls back to static defaults when the API is unreachable.
 */

import { fetchAvailableModels } from "@/services/tauri-commands";

export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  pricing: { prompt: string; completion: string };
  context_length: number;
  architecture: { modality: string; tokenizer: string };
}

/** Provider prefix mapping for grouping OpenRouter models */
const PROVIDER_PREFIXES: Record<string, string[]> = {
  openai: ["openai/"],
  claude: ["anthropic/"],
  gemini: ["google/"],
  kimi: ["moonshot/"],
};

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CacheEntry {
  models: OpenRouterModel[];
  fetchedAt: number;
}

let cache: CacheEntry | null = null;

function isCacheValid(): boolean {
  if (!cache) return false;
  return Date.now() - cache.fetchedAt < CACHE_TTL_MS;
}

/**
 * Parse raw OpenRouter API JSON into typed models.
 * The API returns { data: [...] } where each item has model fields.
 */
function parseOpenRouterResponse(raw: string): OpenRouterModel[] {
  try {
    const parsed = JSON.parse(raw) as { data?: unknown[] };
    if (!parsed.data || !Array.isArray(parsed.data)) {
      return [];
    }
    return parsed.data.map((raw) => {
      const item = raw as Record<string, unknown>;
      return {
        id: (item.id as string) || "",
        name: (item.name as string) || "",
        description: (item.description as string) || "",
        pricing: {
          prompt: ((item.pricing as Record<string, string>)?.prompt) || "0",
          completion: ((item.pricing as Record<string, string>)?.completion) || "0",
        },
        context_length: (item.context_length as number) || 0,
        architecture: {
          modality: ((item.architecture as Record<string, string>)?.modality) || "text",
          tokenizer: ((item.architecture as Record<string, string>)?.tokenizer) || "unknown",
        },
      };
    });
  } catch {
    return [];
  }
}

/**
 * Fetch models from OpenRouter via the Tauri backend.
 * Returns cached results if still valid.
 */
async function fetchModels(): Promise<OpenRouterModel[]> {
  if (isCacheValid()) {
    return cache!.models;
  }

  try {
    const raw = await fetchAvailableModels();
    const models = parseOpenRouterResponse(raw);
    if (models.length > 0) {
      cache = { models, fetchedAt: Date.now() };
      return models;
    }
  } catch {
    // API unreachable, fall through to cache or empty
  }

  // Return stale cache if available, otherwise empty
  return cache?.models ?? [];
}

/**
 * Get models filtered by provider ID (openai, claude, gemini, kimi).
 */
export function getByProvider(
  models: OpenRouterModel[],
  provider: string,
): OpenRouterModel[] {
  const prefixes = PROVIDER_PREFIXES[provider];
  if (!prefixes) return [];
  return models.filter((m) =>
    prefixes.some((prefix) => m.id.startsWith(prefix)),
  );
}

/**
 * Get the latest/best model for a family prefix.
 * Returns the first match (OpenRouter typically sorts by recency).
 */
export function getLatest(
  models: OpenRouterModel[],
  family: string,
): OpenRouterModel | undefined {
  return models.find((m) => m.id.includes(family));
}

/**
 * Format pricing from per-token string to per-1K-token number.
 * OpenRouter pricing is per-token as a string like "0.000005".
 */
export function pricePer1k(perToken: string): number {
  const val = parseFloat(perToken);
  if (isNaN(val)) return 0;
  return val * 1000;
}

/**
 * Format context length to human-readable string.
 */
export function formatContextLength(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${Math.round(tokens / 1_000)}K`;
  }
  return `${tokens}`;
}

/** The public ModelRegistry API */
export interface ModelRegistry {
  models: OpenRouterModel[];
  lastFetched: number;
  loading: boolean;
  error: string | null;

  getByProvider(provider: string): OpenRouterModel[];
  getLatest(family: string): OpenRouterModel | undefined;
  refresh(): Promise<void>;
}

/**
 * Create a model registry instance that fetches and caches OpenRouter models.
 */
export function createModelRegistry(): ModelRegistry {
  const registry: ModelRegistry = {
    models: [],
    lastFetched: 0,
    loading: false,
    error: null,

    getByProvider(provider: string): OpenRouterModel[] {
      return getByProvider(registry.models, provider);
    },

    getLatest(family: string): OpenRouterModel | undefined {
      return getLatest(registry.models, family);
    },

    async refresh(): Promise<void> {
      registry.loading = true;
      registry.error = null;
      try {
        // Invalidate cache to force re-fetch
        cache = null;
        registry.models = await fetchModels();
        registry.lastFetched = Date.now();
      } catch (err) {
        registry.error =
          err instanceof Error ? err.message : "Failed to fetch models";
      } finally {
        registry.loading = false;
      }
    },
  };

  return registry;
}

/**
 * Initialize the registry by fetching models.
 * Safe to call multiple times; respects the cache.
 */
export async function loadModels(): Promise<OpenRouterModel[]> {
  return fetchModels();
}

/**
 * Force a fresh fetch, ignoring the cache.
 */
export async function refreshModels(): Promise<OpenRouterModel[]> {
  cache = null;
  return fetchModels();
}
