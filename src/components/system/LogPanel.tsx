import { useState, useEffect } from "react";
import { formatBytes } from "@/lib/utils";
import { getLogInfo, cleanLogs } from "@/services/tauri-commands";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FileText, Trash2, RefreshCw, Loader2, AlertCircle } from "lucide-react";

interface LogInfo {
  name: string;
  size: number;
  path: string;
  file_count: number;
}

interface LogPanelProps {
  onRefresh?: () => Promise<void>;
}

export function LogPanel({ onRefresh }: LogPanelProps) {
  const [logInfo, setLogInfo] = useState<LogInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cleanResult, setCleanResult] = useState<string | null>(null);

  useEffect(() => {
    loadLogInfo();
  }, []);

  async function loadLogInfo() {
    setLoading(true);
    setError(null);
    try {
      const info = await getLogInfo();
      setLogInfo(info);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to read log info.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleClean() {
    setCleaning(true);
    setCleanResult(null);
    try {
      const result = await cleanLogs();
      setCleanResult(
        result.success
          ? "Journal vacuumed successfully. Kept recent 100MB."
          : result.message || "Vacuum failed. You may need to run with elevated privileges.",
      );
      // Refresh info after cleaning
      if (onRefresh) await onRefresh();
      await loadLogInfo();
    } catch (err) {
      setCleanResult(
        err instanceof Error ? err.message : "Failed to vacuum journal.",
      );
    } finally {
      setCleaning(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-surface-400">
          <Loader2 size={24} className="animate-spin" />
          <p>Scanning system logs...</p>
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
            onClick={loadLogInfo}
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-700">
            <FileText size={24} className="text-surface-500" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">
              System Logs (/var/log)
            </h3>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              {logInfo?.path}
            </p>
            <div className="mt-2 flex items-center gap-4">
              <span className="text-lg font-bold text-surface-900 dark:text-surface-50">
                {formatBytes(logInfo?.size ?? 0)}
              </span>
              <span className="text-xs text-surface-400">
                {logInfo?.file_count ?? 0} files
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              iconLeft={<RefreshCw size={14} />}
              onClick={loadLogInfo}
            >
              Refresh
            </Button>
            <Button
              variant="danger"
              size="sm"
              iconLeft={<Trash2 size={14} />}
              loading={cleaning}
              onClick={handleClean}
            >
              Vacuum Journal
            </Button>
          </div>
        </div>
      </Card>

      {cleanResult && (
        <div className="rounded-lg border border-surface-200 bg-surface-50 px-4 py-3 text-sm text-surface-600 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400">
          {cleanResult}
        </div>
      )}

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
        <p className="font-medium">About log cleanup</p>
        <p className="mt-1 text-xs">
          Vacuuming the journal keeps recent entries (up to 100MB) and removes
          older ones. This operation requires sudo privileges and affects
          systemd/journald logs only.
        </p>
      </div>
    </div>
  );
}
