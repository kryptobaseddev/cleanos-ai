import { useAppStore } from "@/stores/app-store";
import { formatBytes, formatDate } from "@/lib/utils";
import { StatCard } from "./StatCard";
import { StorageChart } from "./StorageChart";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  FileText,
  HardDrive,
  Cpu,
  Clock,
  Scan,
  Sparkles,
  Trash2,
} from "lucide-react";

export function Dashboard() {
  const {
    systemInfo,
    scannedFiles,
    providers,
    activeProvider,
    cleanupRecommendations,
    isScanning,
  } = useAppStore();

  const activeProviderStatus = providers.find((p) => p.id === activeProvider);
  const totalSize = scannedFiles.reduce((sum, f) => sum + f.size, 0);
  const reclaimableSpace = cleanupRecommendations.reduce(
    (sum, r) => sum + r.space_reclaimable,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
          Welcome back
          {systemInfo ? `, ${systemInfo.hostname}` : ""}
        </h1>
        <p className="mt-1 text-surface-500 dark:text-surface-400">
          Here's an overview of your system and files.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<FileText size={20} />}
          title="Total Files"
          value={scannedFiles.length.toLocaleString()}
          subtitle="Across all scanned directories"
          color="blue"
        />
        <StatCard
          icon={<HardDrive size={20} />}
          title="Storage Used"
          value={formatBytes(totalSize)}
          subtitle={
            systemInfo
              ? `of ${formatBytes(systemInfo.disk_total)} total`
              : undefined
          }
          color="purple"
        />
        <StatCard
          icon={<Cpu size={20} />}
          title="AI Provider"
          value={
            activeProviderStatus
              ? activeProviderStatus.connected
                ? "Connected"
                : "Offline"
              : "Not Set"
          }
          subtitle={
            activeProviderStatus
              ? activeProviderStatus.model
              : "Configure in Settings"
          }
          color={
            activeProviderStatus?.connected
              ? "green"
              : activeProviderStatus
                ? "red"
                : "amber"
          }
        />
        <StatCard
          icon={<Clock size={20} />}
          title="Last Scan"
          value={
            scannedFiles.length > 0
              ? formatDate(
                  Math.max(...scannedFiles.map((f) => f.modified_at)),
                )
              : "Never"
          }
          subtitle={
            scannedFiles.length > 0 ? "Most recent file timestamp" : undefined
          }
          color="amber"
        />
      </div>

      {/* Charts and Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <StorageChart />
        </div>

        {/* Quick Actions */}
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-surface-900 dark:text-surface-50">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Button
              variant="primary"
              className="w-full justify-start"
              iconLeft={<Scan size={16} />}
              loading={isScanning}
            >
              {isScanning ? "Scanning..." : "Scan Now"}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              iconLeft={<Trash2 size={16} />}
            >
              Quick Cleanup
              {reclaimableSpace > 0 && (
                <Badge variant="warning" size="sm" className="ml-auto">
                  {formatBytes(reclaimableSpace)}
                </Badge>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              iconLeft={<Sparkles size={16} />}
              disabled={!activeProviderStatus?.connected}
            >
              AI Analysis
            </Button>
          </div>
        </Card>
      </div>

      {/* Cleanup Recommendations */}
      {cleanupRecommendations.length > 0 && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
              Cleanup Recommendations
            </h3>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {cleanupRecommendations.slice(0, 3).map((rec) => (
              <div
                key={rec.id}
                className="flex items-center gap-3 rounded-lg border border-surface-200 p-3 dark:border-surface-700"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                    {rec.title}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    {rec.description}
                  </p>
                </div>
                <Badge
                  variant={
                    rec.risk_level === "low"
                      ? "success"
                      : rec.risk_level === "medium"
                        ? "warning"
                        : "danger"
                  }
                >
                  {rec.risk_level}
                </Badge>
                <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  {formatBytes(rec.space_reclaimable)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
