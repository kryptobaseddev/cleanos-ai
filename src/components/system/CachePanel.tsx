import { useState, useEffect } from "react";
import { formatBytes } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import {
  cleanPackageCache,
  getPackageCaches,
} from "@/services/tauri-commands";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Package,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";

const managerIcons: Record<string, string> = {
  npm: "N",
  pip: "P",
  cargo: "C",
  system: "S",
};

interface CachePanelProps {
  onRefresh?: () => Promise<void>;
}

export function CachePanel({ onRefresh }: CachePanelProps) {
  const { packageCaches, setPackageCaches } = useAppStore();
  const [cleaningManager, setCleaningManager] = useState<string | null>(null);
  const [cleaningAll, setCleaningAll] = useState(false);
  const [loading, setLoading] = useState(packageCaches.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (packageCaches.length === 0) {
      loadPackageCaches();
    }
  }, []);

  async function loadPackageCaches() {
    setLoading(true);
    setError(null);
    try {
      const caches = await getPackageCaches();
      setPackageCaches(caches);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to detect package caches.",
      );
    } finally {
      setLoading(false);
    }
  }

  const totalSize = packageCaches.reduce((sum, c) => sum + c.size, 0);

  async function handleClean(manager: string) {
    setCleaningManager(manager);
    try {
      await cleanPackageCache(manager);
      // Refresh data after cleanup
      if (onRefresh) {
        await onRefresh();
      } else {
        await loadPackageCaches();
      }
    } catch {
      // fail silently for now
    } finally {
      setCleaningManager(null);
    }
  }

  async function handleCleanAll() {
    setCleaningAll(true);
    try {
      for (const cache of packageCaches) {
        await cleanPackageCache(cache.manager);
      }
      // Refresh data after cleanup
      if (onRefresh) {
        await onRefresh();
      } else {
        await loadPackageCaches();
      }
    } catch {
      // fail silently for now
    } finally {
      setCleaningAll(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-surface-400">
          <Loader2 size={24} className="animate-spin" />
          <p>Scanning package caches...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="flex h-48 flex-col items-center justify-center gap-3 text-sm text-surface-400">
          <AlertCircle size={32} className="text-amber-500" />
          <p className="text-surface-600 dark:text-surface-300">{error}</p>
          <Button
            variant="outline"
            size="sm"
            iconLeft={<RefreshCw size={14} />}
            onClick={loadPackageCaches}
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (packageCaches.length === 0) {
    return (
      <Card>
        <div className="flex h-48 flex-col items-center justify-center gap-3 text-sm text-surface-400">
          <Package size={32} className="opacity-60" />
          <p>No package caches detected on this system.</p>
          <Button
            variant="outline"
            size="sm"
            iconLeft={<RefreshCw size={14} />}
            onClick={loadPackageCaches}
          >
            Scan Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-surface-500 dark:text-surface-400">
          Total cache size:{" "}
          <span className="font-medium text-surface-900 dark:text-surface-100">
            {formatBytes(totalSize)}
          </span>
        </p>
        <Button
          variant="danger"
          size="sm"
          iconLeft={<Trash2 size={14} />}
          loading={cleaningAll}
          onClick={handleCleanAll}
        >
          Clean All Caches
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {packageCaches.map((cache) => (
          <Card key={cache.manager} hover>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-100 text-sm font-bold text-surface-600 dark:bg-surface-700 dark:text-surface-300">
                {managerIcons[cache.manager] || (
                  <Package size={18} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                  {cache.manager.toUpperCase()}
                </p>
                <p className="truncate text-xs text-surface-400 dark:text-surface-500">
                  {cache.path}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-surface-500 dark:text-surface-400">
                   <span>{formatBytes(cache.size)}</span>
                 </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                iconLeft={<Trash2 size={14} />}
                loading={cleaningManager === cache.manager}
                onClick={() => handleClean(cache.manager)}
              >
                Clean
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
