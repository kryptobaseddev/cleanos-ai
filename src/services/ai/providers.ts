/**
 * @what AI provider definitions with dynamic model discovery via OpenRouter
 *
 * Provider metadata (auth, capabilities) is static.
 * Model lists can be populated dynamically from the OpenRouter API
 * via the model registry, falling back to static defaults when offline.
 */

import type { AIProviderDefinition, ModelDefinition } from "@/types";
import {
  type OpenRouterModel,
  getByProvider,
  pricePer1k,
  loadModels,
} from "./model-registry";

/** Static fallback models used when the OpenRouter API is unreachable */
const FALLBACK_MODELS: Record<string, ModelDefinition[]> = {
  openai: [
    {
      id: "gpt-4o",
      name: "GPT-4o",
      description:
        "Most capable model with vision support and advanced reasoning.",
      max_tokens: 128000,
      cost_per_1k_input: 0.005,
      cost_per_1k_output: 0.015,
      capabilities: ["chat", "vision", "json", "tools"],
    },
    {
      id: "gpt-4o-mini",
      name: "GPT-4o Mini",
      description: "Fast and cost-effective for routine file analysis tasks.",
      max_tokens: 128000,
      cost_per_1k_input: 0.00015,
      cost_per_1k_output: 0.0006,
      capabilities: ["chat", "vision", "json", "tools"],
    },
    {
      id: "o1",
      name: "o1",
      description: "Advanced reasoning model for complex analysis.",
      max_tokens: 200000,
      cost_per_1k_input: 0.015,
      cost_per_1k_output: 0.06,
      capabilities: ["chat", "json"],
    },
    {
      id: "o1-mini",
      name: "o1 Mini",
      description: "Efficient reasoning model for focused tasks.",
      max_tokens: 128000,
      cost_per_1k_input: 0.003,
      cost_per_1k_output: 0.012,
      capabilities: ["chat", "json"],
    },
  ],
  claude: [
    {
      id: "claude-opus-4-20250514",
      name: "Claude Opus 4",
      description:
        "Most capable model for complex file analysis and reasoning.",
      max_tokens: 200000,
      cost_per_1k_input: 0.015,
      cost_per_1k_output: 0.075,
      capabilities: ["chat", "vision", "json", "tools"],
    },
    {
      id: "claude-sonnet-4-20250514",
      name: "Claude Sonnet 4",
      description: "Balanced performance for everyday file analysis.",
      max_tokens: 200000,
      cost_per_1k_input: 0.003,
      cost_per_1k_output: 0.015,
      capabilities: ["chat", "vision", "json", "tools"],
    },
    {
      id: "claude-3-5-haiku-20241022",
      name: "Claude 3.5 Haiku",
      description: "Fast and affordable for high-volume tasks.",
      max_tokens: 200000,
      cost_per_1k_input: 0.001,
      cost_per_1k_output: 0.005,
      capabilities: ["chat", "vision", "json", "tools"],
    },
  ],
  gemini: [
    {
      id: "gemini-2.0-flash",
      name: "Gemini 2.0 Flash",
      description: "Fast and capable with a 1M token context window.",
      max_tokens: 1048576,
      cost_per_1k_input: 0.0001,
      cost_per_1k_output: 0.0004,
      capabilities: ["chat", "vision", "json", "tools"],
    },
    {
      id: "gemini-1.5-pro",
      name: "Gemini 1.5 Pro",
      description:
        "Advanced reasoning with extended context for large file sets.",
      max_tokens: 2097152,
      cost_per_1k_input: 0.00125,
      cost_per_1k_output: 0.005,
      capabilities: ["chat", "vision", "json", "tools"],
    },
  ],
  kimi: [
    {
      id: "moonshot-v1-128k",
      name: "Kimi 128K",
      description: "Long context model for analyzing large file sets.",
      max_tokens: 128000,
      capabilities: ["chat", "json"],
    },
    {
      id: "moonshot-v1-32k",
      name: "Kimi 32K",
      description: "Balanced context model for general file analysis.",
      max_tokens: 32000,
      capabilities: ["chat", "json"],
    },
  ],
};

/** Static provider metadata (auth, capabilities, defaults) */
const PROVIDER_META: Omit<AIProviderDefinition, "models">[] = [
  {
    id: "openai",
    name: "OpenAI",
    description:
      "GPT-4o and o1 models for file analysis and intelligent categorization.",
    auth_methods: [
      {
        type: "api",
        label: "API Key",
        description: "Your OpenAI API key",
        key_placeholder: "sk-...",
        help_url: "https://platform.openai.com/api-keys",
      },
    ],
    default_model: "gpt-4o-mini",
    capabilities: {
      chat: true,
      vision: true,
      json: true,
      streaming: true,
      tools: true,
    },
  },
  {
    id: "gemini",
    name: "Google Gemini",
    description:
      "Gemini models with large context windows for bulk file analysis.",
    auth_methods: [
      {
        type: "api",
        label: "API Key",
        description: "Your Google AI Studio API key",
        key_placeholder: "AIza...",
        help_url: "https://aistudio.google.com/apikey",
      },
    ],
    default_model: "gemini-2.0-flash",
    capabilities: {
      chat: true,
      vision: true,
      json: true,
      streaming: true,
      tools: true,
    },
  },
  {
    id: "claude",
    name: "Anthropic Claude",
    description:
      "Claude models with strong analytical capabilities for file organization.",
    auth_methods: [
      {
        type: "api",
        label: "API Key",
        description: "Your Anthropic API key",
        key_placeholder: "sk-ant-...",
        help_url: "https://console.anthropic.com/settings/keys",
      },
    ],
    default_model: "claude-sonnet-4-20250514",
    capabilities: {
      chat: true,
      vision: true,
      json: true,
      streaming: true,
      tools: true,
    },
  },
  {
    id: "kimi",
    name: "Moonshot Kimi",
    description:
      "Kimi models for multilingual file analysis with long context support.",
    auth_methods: [
      {
        type: "api",
        label: "API Key",
        description: "Your Moonshot API key",
        key_placeholder: "sk-...",
        help_url: "https://platform.moonshot.cn/console/api-keys",
      },
    ],
    default_model: "moonshot-v1-128k",
    capabilities: {
      chat: true,
      vision: false,
      json: true,
      streaming: true,
      tools: false,
    },
  },
];

/**
 * Convert an OpenRouter model to the app's ModelDefinition format.
 * Strips the provider prefix from the ID (e.g., "openai/gpt-4o" -> "gpt-4o").
 */
function toModelDefinition(m: OpenRouterModel): ModelDefinition {
  // Strip provider prefix for local model ID
  const localId = m.id.includes("/") ? m.id.split("/").slice(1).join("/") : m.id;

  return {
    id: localId,
    name: m.name,
    description: m.description || m.name,
    max_tokens: m.context_length,
    cost_per_1k_input: pricePer1k(m.pricing.prompt),
    cost_per_1k_output: pricePer1k(m.pricing.completion),
    capabilities: inferCapabilities(m),
  };
}

/**
 * Infer capabilities from model metadata.
 */
function inferCapabilities(m: OpenRouterModel): string[] {
  const caps = ["chat"];
  const modality = m.architecture?.modality || "";
  if (modality.includes("image") || modality.includes("multimodal")) {
    caps.push("vision");
  }
  caps.push("json");
  return caps;
}

/**
 * Build provider definitions using static fallback models.
 * Used as the synchronous default export.
 */
function buildStaticProviders(): AIProviderDefinition[] {
  return PROVIDER_META.map((meta) => ({
    ...meta,
    models: FALLBACK_MODELS[meta.id] || [],
  }));
}

/**
 * Static provider definitions for synchronous access.
 * ProviderConfig should prefer getProvidersWithModels() for live data.
 */
export const providers: AIProviderDefinition[] = buildStaticProviders();

/**
 * Fetch live models from OpenRouter and merge with provider metadata.
 * Falls back to static defaults per provider if no API models are found.
 */
export async function getProvidersWithModels(): Promise<
  AIProviderDefinition[]
> {
  const allModels = await loadModels();

  return PROVIDER_META.map((meta) => {
    const apiModels = getByProvider(allModels, meta.id);
    const models =
      apiModels.length > 0
        ? apiModels.map(toModelDefinition)
        : (FALLBACK_MODELS[meta.id] || []);

    return { ...meta, models };
  });
}

/**
 * Get fallback models for a specific provider.
 */
export function getFallbackModels(providerId: string): ModelDefinition[] {
  return FALLBACK_MODELS[providerId] || [];
}
