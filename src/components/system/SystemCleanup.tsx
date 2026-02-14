import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DockerPanel } from "./DockerPanel";
import { CachePanel } from "./CachePanel";
import {
  HardDrive,
  Container,
  Package,
  FileText,
  Globe,
  Trash2,
  Sparkles,
} from "lucide-react";

type CleanupTab =
  | "overview"
  | "docker"
  | "packages"
  | "logs"
  | "browser";

const tabs: Array<{ id: CleanupTab; label: string; icon: React.ReactNode }> = [
  { id: "overview", label: "Overview", icon: <HardDrive size={16} /> },
  { id: "docker", label: "Docker", icon: <Container size={16} /> },
  { id: "packages", label: "Package Caches", icon: <Package size={16} /> },
  { id: "logs", label: "Logs", icon: <FileText size={16} /> },
  { id: "browser", label: "Browser Caches", icon: <Globe size={16} /> },
];

export function SystemCleanup() {
  const [activeTab, setActiveTab] = useState<CleanupTab>("overview");
  const {
    systemInfo,
    dockerInfo,
    packageCaches,
    cleanupRecommendations,
  } = useAppStore();

  const dockerSpace =
    (dockerInfo?.build_cache_size ?? 0) +
    (dockerInfo?.images.filter((i) => !i.in_use).reduce((s, i) => s + i.size, 0) ?? 0) +
    (dockerInfo?.volumes.filter((v) => !v.in_use).reduce((s, v) => s + v.size, 0) ?? 0);
  const cacheSpace = packageCaches.reduce((s, c) => s + c.size, 0);
  const totalReclaimable =
    cleanupRecommendations.reduce((s, r) => s + r.space_reclaimable, 0) +
    dockerSpace +
    cacheSpace;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            System Cleanup
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            Free up disk space by removing unused files and caches.
          </p>
        </div>
        <Button variant="primary" iconLeft={<Sparkles size={16} />}>
          Smart Cleanup
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-surface-100 p-1 dark:bg-surface-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200",
              activeTab === tab.id
                ? "bg-white text-surface-900 shadow-sm dark:bg-surface-700 dark:text-surface-50"
                : "text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-300",
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* System Stats */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Disk Usage
              </p>
              <p className="mt-1 text-2xl font-bold text-surface-900 dark:text-surface-50">
                {systemInfo
                  ? formatBytes(systemInfo.disk_used)
                  : "--"}
              </p>
              {systemInfo && (
                <ProgressBar
                  value={systemInfo.disk_used}
                  max={systemInfo.disk_total}
                  size="sm"
                  className="mt-3"
                  variant={
                    systemInfo.disk_used / systemInfo.disk_total > 0.9
                      ? "danger"
                      : systemInfo.disk_used / systemInfo.disk_total > 0.75
                        ? "warning"
                        : "primary"
                  }
                />
              )}
            </Card>
            <Card>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Reclaimable Space
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatBytes(totalReclaimable)}
              </p>
              <p className="mt-1 text-xs text-surface-400">
                Across all categories
              </p>
            </Card>
            <Card>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Memory Usage
              </p>
              <p className="mt-1 text-2xl font-bold text-surface-900 dark:text-surface-50">
                {systemInfo
                  ? formatBytes(systemInfo.memory_used)
                  : "--"}
              </p>
              {systemInfo && (
                <ProgressBar
                  value={systemInfo.memory_used}
                  max={systemInfo.memory_total}
                  size="sm"
                  className="mt-3"
                  variant={
                    systemInfo.memory_used / systemInfo.memory_total > 0.9
                      ? "danger"
                      : "primary"
                  }
                />
              )}
            </Card>
          </div>

          {/* One-Click Cleanup */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                  One-Click Cleanup
                </h3>
                <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                  Remove unused Docker images, package caches, and temporary files.
                </p>
              </div>
              <Button
                variant="danger"
                iconLeft={<Trash2 size={16} />}
              >
                Clean All ({formatBytes(totalReclaimable)})
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-surface-200 p-3 dark:border-surface-700">
                <div className="flex items-center gap-2 text-sm font-medium text-surface-700 dark:text-surface-300">
                  <Container size={14} />
                  Docker
                </div>
                <p className="mt-1 text-lg font-bold text-surface-900 dark:text-surface-50">
                  {formatBytes(dockerSpace)}
                </p>
              </div>
              <div className="rounded-lg border border-surface-200 p-3 dark:border-surface-700">
                <div className="flex items-center gap-2 text-sm font-medium text-surface-700 dark:text-surface-300">
                  <Package size={14} />
                  Package Caches
                </div>
                <p className="mt-1 text-lg font-bold text-surface-900 dark:text-surface-50">
                  {formatBytes(cacheSpace)}
                </p>
              </div>
              <div className="rounded-lg border border-surface-200 p-3 dark:border-surface-700">
                <div className="flex items-center gap-2 text-sm font-medium text-surface-700 dark:text-surface-300">
                  <FileText size={14} />
                  System Logs
                </div>
                <p className="mt-1 text-lg font-bold text-surface-900 dark:text-surface-50">
                  --
                </p>
              </div>
              <div className="rounded-lg border border-surface-200 p-3 dark:border-surface-700">
                <div className="flex items-center gap-2 text-sm font-medium text-surface-700 dark:text-surface-300">
                  <Globe size={14} />
                  Browser Caches
                </div>
                <p className="mt-1 text-lg font-bold text-surface-900 dark:text-surface-50">
                  --
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "docker" && <DockerPanel />}
      {activeTab === "packages" && <CachePanel />}

      {activeTab === "logs" && (
        <Card>
          <div className="flex h-48 flex-col items-center justify-center text-surface-400">
            <FileText size={40} className="mb-3" />
            <p className="text-lg font-medium">System Logs</p>
            <p className="text-sm">Log analysis will appear here after scanning.</p>
          </div>
        </Card>
      )}

      {activeTab === "browser" && (
        <Card>
          <div className="flex h-48 flex-col items-center justify-center text-surface-400">
            <Globe size={40} className="mb-3" />
            <p className="text-lg font-medium">Browser Caches</p>
            <p className="text-sm">
              Chrome, Brave, and Firefox cache analysis will appear here.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
