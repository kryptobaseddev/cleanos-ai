import { useState } from "react";
import { formatBytes } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { cleanPackageCache } from "@/services/tauri-commands";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Package, Trash2 } from "lucide-react";

const managerIcons: Record<string, string> = {
  npm: "N",
  pip: "P",
  cargo: "C",
  system: "S",
};

export function CachePanel() {
  const { packageCaches } = useAppStore();
  const [cleaningManager, setCleaningManager] = useState<string | null>(null);
  const [cleaningAll, setCleaningAll] = useState(false);

  const totalSize = packageCaches.reduce((sum, c) => sum + c.size, 0);

  async function handleClean(manager: string) {
    setCleaningManager(manager);
    try {
      await cleanPackageCache(manager);
    } catch {
      // fail silently
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
    } catch {
      // fail silently
    } finally {
      setCleaningAll(false);
    }
  }

  if (packageCaches.length === 0) {
    return (
      <Card>
        <div className="flex h-48 items-center justify-center text-sm text-surface-400">
          No package caches detected.
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
                  <span>{cache.item_count} items</span>
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
