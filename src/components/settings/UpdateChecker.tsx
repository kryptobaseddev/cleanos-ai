import { Card } from "@/components/ui/Card";
import { useUpdateChecker } from "@/hooks/useUpdateChecker";
import { RefreshCw, Download, CheckCircle, AlertCircle } from "lucide-react";

export function UpdateChecker() {
  const {
    currentVersion,
    updateAvailable,
    updateInfo,
    checking,
    installing,
    error,
    lastChecked,
    checkForUpdates,
    installUpdate,
  } = useUpdateChecker(false);

  return (
    <Card>
      <div className="space-y-4">
        {/* Current version */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
              Current Version
            </p>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              {currentVersion || "Loading..."}
            </p>
          </div>
          <button
            onClick={() => checkForUpdates(false)}
            disabled={checking || installing}
            className="flex items-center gap-2 rounded-lg border border-surface-200 px-3 py-1.5 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-surface-600 dark:text-surface-300 dark:hover:bg-surface-700"
          >
            <RefreshCw
              size={14}
              className={checking ? "animate-spin" : ""}
            />
            {checking ? "Checking..." : "Check for Updates"}
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-800 dark:bg-red-900/20">
            <AlertCircle
              size={16}
              className="mt-0.5 shrink-0 text-red-500"
            />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Up to date -- only show after a successful check */}
        {!checking && !error && !updateAvailable && lastChecked && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 dark:border-green-800 dark:bg-green-900/20">
            <CheckCircle size={16} className="shrink-0 text-green-500" />
            <p className="text-sm text-green-700 dark:text-green-400">
              You are running the latest version.
            </p>
          </div>
        )}

        {/* Update available */}
        {updateAvailable && updateInfo && (
          <div className="space-y-3 rounded-lg border border-primary-200 bg-primary-50 p-3 dark:border-primary-800 dark:bg-primary-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                  Update Available: v{updateInfo.version}
                </p>
                {updateInfo.date && (
                  <p className="text-xs text-primary-600 dark:text-primary-400">
                    Released: {updateInfo.date}
                  </p>
                )}
              </div>
              <button
                onClick={installUpdate}
                disabled={installing}
                className="flex items-center gap-2 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download
                  size={14}
                  className={installing ? "animate-bounce" : ""}
                />
                {installing ? "Installing..." : "Install Update"}
              </button>
            </div>

            {/* Changelog */}
            {updateInfo.body && (
              <div className="border-t border-primary-200 pt-2 dark:border-primary-700">
                <p className="mb-1 text-xs font-medium text-primary-600 dark:text-primary-400">
                  What's New:
                </p>
                <p className="whitespace-pre-wrap text-xs text-primary-700 dark:text-primary-300">
                  {updateInfo.body}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Installing progress */}
        {installing && (
          <div className="flex items-center gap-2 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 dark:border-surface-700 dark:bg-surface-800">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            <p className="text-sm text-surface-600 dark:text-surface-400">
              Downloading and installing update. The app will restart
              automatically.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
