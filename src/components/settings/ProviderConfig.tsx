import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { providers as providerDefs } from "@/services/ai/providers";
import {
  testAiConnection,
  storeApiKey,
  deleteApiKey,
} from "@/services/tauri-commands";
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
} from "lucide-react";

export function ProviderConfig() {
  const { providers: providerStatuses, activeProvider, setActiveProvider } =
    useAppStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>(
    {},
  );
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, boolean | null>>(
    {},
  );

  function getStatus(id: string) {
    return providerStatuses.find((p) => p.id === id);
  }

  async function handleTest(providerId: string) {
    const key = apiKeys[providerId];
    if (!key) return;
    const def = providerDefs.find((p) => p.id === providerId);
    const model = selectedModels[providerId] || def?.default_model || "";

    setTesting(providerId);
    setTestResult((prev) => ({ ...prev, [providerId]: null }));
    try {
      const ok = await testAiConnection(providerId, key, model);
      setTestResult((prev) => ({ ...prev, [providerId]: ok }));
      if (ok) {
        await storeApiKey(providerId, key);
      }
    } catch {
      setTestResult((prev) => ({ ...prev, [providerId]: false }));
    } finally {
      setTesting(null);
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
      setTestResult((prev) => ({ ...prev, [providerId]: null }));
      if (activeProvider === providerId) setActiveProvider(null);
    } catch {
      // fail silently
    }
  }

  return (
    <div className="space-y-3">
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
                  <Input
                    variant="password"
                    label="API Key"
                    placeholder={
                      def.auth_methods[0]?.key_placeholder || "Enter API key"
                    }
                    value={apiKeys[def.id] || ""}
                    onChange={(e) =>
                      setApiKeys((prev) => ({
                        ...prev,
                        [def.id]: e.target.value,
                      }))
                    }
                  />

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
                          {m.name} - {m.description}
                        </option>
                      ))}
                    </select>
                  </div>

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
                      loading={testing === def.id}
                      onClick={() => handleTest(def.id)}
                      disabled={!apiKeys[def.id]}
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
