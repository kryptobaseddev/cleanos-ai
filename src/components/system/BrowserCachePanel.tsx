import { useState, useEffect } from "react";
import { formatBytes } from "@/lib/utils";
import { getBrowserCaches, cleanBrowserCache } from "@/services/tauri-commands";
import type { PackageCacheInfo } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Globe, Trash2, RefreshCw, Loader2, AlertCircle } from "lucide-react";

const browserIcons: Record<string, string> = {
  "Google Chrome": "C",
  Brave: "B",
  Firefox: "F",
  Chromium: "Cr",
};

interface BrowserCachePanelProps {
  onRefresh?: () => Promise<void>;
}

export function BrowserCachePanel({ onRefresh }: BrowserCachePanelProps) {
  const [caches, setCaches] = useState<PackageCacheInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cleaningBrowser, setCleaningBrowser] = useState<string | null>(null);
  const [cleaningAll, setCleaningAll] = useState(false);

  useEffect(() => {
    loadCaches();
  }, []);

  async function loadCaches() {
    setLoading(true);
    setError(null);
    try {
      const result = await getBrowserCaches();
      setCaches(result.filter((c) => c.exists));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to detect browser caches.",
      );
    } finally {
      setLoading(false);
    }
  }

  const totalSize = caches.reduce((sum, c) => sum + c.size, 0);

  async function handleClean(browser: string) {
    setCleaningBrowser(browser);
    try {
      await cleanBrowserCache(browser);
      if (onRefresh) await onRefresh();
      await loadCaches();
    } catch {
      // fail silently
    } finally {
      setCleaningBrowser(null);
    }
  }

  async function handleCleanAll() {
    setCleaningAll(true);
    try {
      for (const cache of caches) {
        await cleanBrowserCache(cache.manager);
      }
      if (onRefresh) await onRefresh();
      await loadCaches();
    } catch {
      // fail silently
    } finally {
      setCleaningAll(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-surface-400">
          <Loader2 size={24} className="animate-spin" />
          <p>Scanning browser caches...</p>
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
            onClick={loadCaches}
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (caches.length === 0) {
    return (
      <Card>
        <div className="flex h-48 flex-col items-center justify-center gap-3 text-sm text-surface-400">
          <Globe size={32} className="opacity-60" />
          <p>No browser caches detected on this system.</p>
          <Button
            variant="outline"
            size="sm"
            iconLeft={<RefreshCw size={14} />}
            onClick={loadCaches}
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
          Total browser cache:{" "}
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
          Clean All Browser Caches
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {caches.map((cache) => (
          <Card key={cache.manager} hover>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-100 text-sm font-bold text-surface-600 dark:bg-surface-700 dark:text-surface-300">
                {browserIcons[cache.manager] || <Globe size={18} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                  {cache.manager}
                </p>
                <p className="truncate text-xs text-surface-400 dark:text-surface-500">
                  {cache.path}
                </p>
                <div className="mt-2 text-xs text-surface-500 dark:text-surface-400">
                  <span>{formatBytes(cache.size)}</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                iconLeft={<Trash2 size={14} />}
                loading={cleaningBrowser === cache.manager}
                onClick={() => handleClean(cache.manager)}
              >
                Clean
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
        <p className="font-medium">About browser cache cleanup</p>
        <p className="mt-1 text-xs">
          Clearing browser caches will remove cached web content, images, and
          scripts. This will not affect your bookmarks, passwords, or browsing
          history. Browsers will rebuild their caches as you browse.
        </p>
      </div>
    </div>
  );
}
