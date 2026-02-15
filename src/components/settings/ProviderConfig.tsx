import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import {
  providers as staticProviderDefs,
  getProvidersWithModels,
} from "@/services/ai/providers";
import { formatContextLength } from "@/services/ai/model-registry";
import {
  testAiConnection,
  storeApiKey,
  hasApiKey,
  deleteApiKey,
} from "@/services/tauri-commands";
import type { AIProviderDefinition, ProviderStatus } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  ChevronDown,
  ChevronUp,
  Check,
  X,
  ExternalLink,
  Trash2,
  RefreshCw,
  Save,
} from "lucide-react";

export function ProviderConfig() {
  const {
    providers: providerStatuses,
    activeProvider,
    setActiveProvider,
    setProviders,
  } = useAppStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>(
    {},
  );
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, boolean | null>>(
    {},
  );
  const [providerDefs, setProviderDefs] =
    useState<AIProviderDefinition[]>(staticProviderDefs);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsSource, setModelsSource] = useState<"static" | "live">(
    "static",
  );
  const [savedKeys, setSavedKeys] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<Record<string, boolean>>({});

  const PROVIDER_IDS = ["openai", "claude", "gemini", "kimi"];

  // Load saved API keys on mount and update provider connection status
  useEffect(() => {
    async function loadSavedKeys() {
      const saved: Record<string, boolean> = {};
      const statuses: ProviderStatus[] = [];
      for (const id of PROVIDER_IDS) {
        try {
          saved[id] = await hasApiKey(id);
        } catch {
          saved[id] = false;
        }
        const def = staticProviderDefs.find((p) => p.id === id);
        statuses.push({
          id,
          connected: saved[id],
          model: def?.default_model ?? "",
        });
      }
      setSavedKeys(saved);
      setProviders(statuses);
    }
    loadSavedKeys();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadModels = useCallback(async () => {
    setModelsLoading(true);
    try {
      const liveProviders = await getProvidersWithModels();
      setProviderDefs(liveProviders);
      // If we got models that differ from static, mark as live
      const hasLiveModels = liveProviders.some(
        (p) =>
          p.models.length >
          (staticProviderDefs.find((s) => s.id === p.id)?.models.length ?? 0),
      );
      setModelsSource(hasLiveModels ? "live" : "static");
    } catch {
      // Keep static fallbacks on failure
      setModelsSource("static");
    } finally {
      setModelsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  function getStatus(id: string) {
    return providerStatuses.find((p) => p.id === id);
  }

  async function handleTest(providerId: string) {
    const key = apiKeys[providerId] || null;
    // Allow testing if user typed a key OR if a key is saved in keyring
    if (!key && !savedKeys[providerId]) return;
    const def = providerDefs.find((p) => p.id === providerId);
    const model = selectedModels[providerId] || def?.default_model || "";

    setTesting(providerId);
    setTestResult((prev) => ({ ...prev, [providerId]: null }));
    try {
      // Pass key (or null to let backend read from keyring)
      const ok = await testAiConnection(providerId, key, model);
      setTestResult((prev) => ({ ...prev, [providerId]: ok }));
      if (ok) {
        if (key) {
          await storeApiKey(providerId, key);
          setSavedKeys((prev) => ({ ...prev, [providerId]: true }));
        }
        // Update provider connected status in global store
        setProviders(
          providerStatuses.map((p) =>
            p.id === providerId ? { ...p, connected: true, model } : p,
          ),
        );
      }
    } catch {
      setTestResult((prev) => ({ ...prev, [providerId]: false }));
    } finally {
      setTesting(null);
    }
  }

  async function handleSave(providerId: string) {
    const key = apiKeys[providerId];
    if (!key) return;
    setSaving(providerId);
    try {
      await storeApiKey(providerId, key);
      setSavedKeys((prev) => ({ ...prev, [providerId]: true }));
      setSaveSuccess((prev) => ({ ...prev, [providerId]: true }));
      setTimeout(() => {
        setSaveSuccess((prev) => ({ ...prev, [providerId]: false }));
      }, 2000);
    } catch {
      // fail silently
    } finally {
      setSaving(null);
    }
  }

  async function handleRemove(providerId: string) {
    try {
      await deleteApiKey(providerId);
      setApiKeys((prev) => {
        const next = { ...prev };
        delete next[providerId];
        return next;
      });
      setSavedKeys((prev) => ({ ...prev, [providerId]: false }));
      setTestResult((prev) => ({ ...prev, [providerId]: null }));
      // Update provider connected status in global store
      setProviders(
        providerStatuses.map((p) =>
          p.id === providerId ? { ...p, connected: false } : p,
        ),
      );
      if (activeProvider === providerId) setActiveProvider(null);
    } catch {
      // fail silently
    }
  }

  return (
    <div className="space-y-3">
      {/* Refresh Models header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-surface-500 dark:text-surface-400">
            Models:{" "}
            {modelsSource === "live" ? "OpenRouter (live)" : "Static defaults"}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          loading={modelsLoading}
          iconLeft={<RefreshCw size={14} />}
          onClick={loadModels}
        >
          Refresh Models
        </Button>
      </div>

      {providerDefs.map((def) => {
        const status = getStatus(def.id);
        const isExpanded = expandedId === def.id;
        const isActive = activeProvider === def.id;
        const model = selectedModels[def.id] || def.default_model;

        return (
          <Card key={def.id} padding="none" hover>
            {/* Header */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : def.id)}
              className="flex w-full items-center gap-3 p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-100 text-sm font-bold text-surface-600 dark:bg-surface-700 dark:text-surface-300">
                {def.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                    {def.name}
                  </p>
                  {isActive && (
                    <Badge variant="success" size="sm">
                      Active
                    </Badge>
                  )}
                  <Badge variant="default" size="sm">
                    {def.models.length} model
                    {def.models.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  {def.description}
                </p>
              </div>
              {status && (
                <Badge
                  variant={status.connected ? "success" : "danger"}
                  size="sm"
                >
                  {status.connected ? "Connected" : "Disconnected"}
                </Badge>
              )}
              {isExpanded ? (
                <ChevronUp size={16} className="text-surface-400" />
              ) : (
                <ChevronDown size={16} className="text-surface-400" />
              )}
            </button>

            {/* Expanded Config */}
            {isExpanded && (
              <div className="border-t border-surface-200 px-4 py-4 dark:border-surface-700">
                <div className="space-y-4">
                  <div>
                    <Input
                      variant="password"
                      label="API Key"
                      placeholder={
                        savedKeys[def.id]
                          ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022 (saved)"
                          : def.auth_methods[0]?.key_placeholder || "Enter API key"
                      }
                      value={apiKeys[def.id] || ""}
                      onChange={(e) =>
                        setApiKeys((prev) => ({
                          ...prev,
                          [def.id]: e.target.value,
                        }))
                      }
                    />
                    {savedKeys[def.id] && !apiKeys[def.id] && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                        <Check size={12} /> Key saved
                      </p>
                    )}
                    {saveSuccess[def.id] && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                        <Check size={12} /> Saved successfully
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
                      Model
                    </label>
                    <select
                      value={model}
                      onChange={(e) =>
                        setSelectedModels((prev) => ({
                          ...prev,
                          [def.id]: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-700 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300"
                    >
                      {def.models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({formatContextLength(m.max_tokens)} ctx
                          {m.cost_per_1k_input != null
                            ? ` | $${m.cost_per_1k_input.toFixed(4)}/1K in`
                            : ""}
                          )
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected model details */}
                  {(() => {
                    const selected = def.models.find((m) => m.id === model);
                    if (!selected) return null;
                    return (
                      <div className="rounded-lg bg-surface-50 px-3 py-2 dark:bg-surface-800">
                        <p className="text-xs font-medium text-surface-600 dark:text-surface-400">
                          {selected.description}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-surface-500 dark:text-surface-400">
                          <span>
                            Context: {formatContextLength(selected.max_tokens)}{" "}
                            tokens
                          </span>
                          {selected.cost_per_1k_input != null && (
                            <span>
                              Input: ${selected.cost_per_1k_input.toFixed(4)}/1K
                            </span>
                          )}
                          {selected.cost_per_1k_output != null && (
                            <span>
                              Output: ${selected.cost_per_1k_output.toFixed(4)}
                              /1K
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Test result */}
                  {testResult[def.id] !== undefined &&
                    testResult[def.id] !== null && (
                      <div
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                          testResult[def.id]
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                            : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
                        )}
                      >
                        {testResult[def.id] ? (
                          <>
                            <Check size={16} /> Connection successful
                          </>
                        ) : (
                          <>
                            <X size={16} /> Connection failed
                          </>
                        )}
                      </div>
                    )}

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      loading={saving === def.id}
                      iconLeft={<Save size={14} />}
                      onClick={() => handleSave(def.id)}
                      disabled={!apiKeys[def.id]}
                    >
                      Save Key
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      loading={testing === def.id}
                      onClick={() => handleTest(def.id)}
                      disabled={!apiKeys[def.id] && !savedKeys[def.id]}
                    >
                      Test Connection
                    </Button>
                    {!isActive && status?.connected && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveProvider(def.id)}
                      >
                        Set as Active
                      </Button>
                    )}
                    {status?.connected && (
                      <Button
                        variant="ghost"
                        size="sm"
                        iconLeft={<Trash2 size={14} />}
                        onClick={() => handleRemove(def.id)}
                      >
                        Remove
                      </Button>
                    )}
                    {def.auth_methods[0]?.help_url && (
                      <a
                        href={def.auth_methods[0].help_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto inline-flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600"
                      >
                        Get API Key
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
