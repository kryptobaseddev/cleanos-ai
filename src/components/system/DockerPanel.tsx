import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { cleanDocker, getDockerInfo } from "@/services/tauri-commands";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Box,
  Container,
  Database,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";

type DockerTab = "images" | "containers" | "volumes";

interface DockerPanelProps {
  onRefresh?: () => Promise<void>;
}

export function DockerPanel({ onRefresh }: DockerPanelProps) {
  const { dockerInfo, setDockerInfo } = useAppStore();
  const [activeTab, setActiveTab] = useState<DockerTab>("images");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [cleaning, setCleaning] = useState(false);
  const [loading, setLoading] = useState(!dockerInfo);
  const [error, setError] = useState<string | null>(null);
  const [cleanResult, setCleanResult] = useState<string | null>(null);

  useEffect(() => {
    if (!dockerInfo) {
      loadDockerInfo();
    }
  }, []);

  async function loadDockerInfo() {
    setLoading(true);
    setError(null);
    try {
      const info = await getDockerInfo();
      setDockerInfo(info);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load Docker info. Is Docker running?",
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-surface-400">
          <Loader2 size={24} className="animate-spin" />
          <p>Loading Docker info...</p>
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
            onClick={loadDockerInfo}
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (!dockerInfo) {
    return (
      <Card>
        <div className="flex h-48 flex-col items-center justify-center gap-3 text-sm text-surface-400">
          <AlertCircle size={32} />
          <p>No Docker data available.</p>
          <Button
            variant="outline"
            size="sm"
            iconLeft={<RefreshCw size={14} />}
            onClick={loadDockerInfo}
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const tabs: Array<{ id: DockerTab; label: string; icon: React.ReactNode; count: number }> = [
    { id: "images", label: "Images", icon: <Box size={16} />, count: dockerInfo.images.length },
    { id: "containers", label: "Containers", icon: <Container size={16} />, count: dockerInfo.containers.length },
    { id: "volumes", label: "Volumes", icon: <Database size={16} />, count: dockerInfo.volumes.length },
  ];

  const toggleId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  async function handleClean(target: string, specificIds?: string[]) {
    setCleaning(true);
    setError(null);
    setCleanResult(null);
    try {
      const result = await cleanDocker(target, specificIds);
      if (result.success) {
        setCleanResult(result.message || "Cleanup completed.");
      } else {
        setError(result.message || "Cleanup failed.");
      }
      setSelectedIds(new Set());
      // Refresh data after cleanup
      if (onRefresh) {
        await onRefresh();
      } else {
        await loadDockerInfo();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cleanup failed.");
    } finally {
      setCleaning(false);
    }
  }

  const totalImageSize = dockerInfo.images.reduce((s, i) => s + i.size, 0);
  const totalVolumeSize = dockerInfo.volumes.reduce((s, v) => s + v.size, 0);

  return (
    <Card padding="none">
      {/* Stats Bar */}
      <div className="flex items-center gap-6 border-b border-surface-200 px-4 py-3 dark:border-surface-700">
        <div className="text-sm">
          <span className="text-surface-500 dark:text-surface-400">Images: </span>
          <span className="font-medium text-surface-900 dark:text-surface-100">
            {dockerInfo.images.length} ({formatBytes(totalImageSize)})
          </span>
        </div>
        <div className="text-sm">
          <span className="text-surface-500 dark:text-surface-400">Containers: </span>
          <span className="font-medium text-surface-900 dark:text-surface-100">
            {dockerInfo.containers.length}
          </span>
        </div>
        <div className="text-sm">
          <span className="text-surface-500 dark:text-surface-400">Volumes: </span>
          <span className="font-medium text-surface-900 dark:text-surface-100">
            {dockerInfo.volumes.length} ({formatBytes(totalVolumeSize)})
          </span>
        </div>
        <div className="text-sm">
          <span className="text-surface-500 dark:text-surface-400">Build Cache: </span>
          <span className="font-medium text-surface-900 dark:text-surface-100">
            {formatBytes(dockerInfo.build_cache_size)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-200 dark:border-surface-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSelectedIds(new Set());
            }}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all",
              activeTab === tab.id
                ? "border-primary-500 text-primary-600 dark:text-primary-400"
                : "border-transparent text-surface-500 hover:text-surface-700 dark:text-surface-400",
            )}
          >
            {tab.icon}
            {tab.label}
            <span className="rounded-full bg-surface-100 px-1.5 py-0.5 text-xs dark:bg-surface-700">
              {tab.count}
            </span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 px-4">
          {selectedIds.size > 0 && (
            <Button
              variant="danger"
              size="sm"
              iconLeft={<Trash2 size={14} />}
              loading={cleaning}
              onClick={() => handleClean(activeTab, Array.from(selectedIds))}
            >
              Clean Selected ({selectedIds.size})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            loading={cleaning}
            onClick={() => handleClean(activeTab)}
          >
            Clean All Unused
          </Button>
        </div>
      </div>

      {/* Error / Result */}
      {(error || cleanResult) && (
        <div className="border-b border-surface-200 px-4 py-3 dark:border-surface-700">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}
          {cleanResult && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
              {cleanResult}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="divide-y divide-surface-100 dark:divide-surface-700/50">
        {activeTab === "images" &&
          dockerInfo.images.map((img, idx) => (
            <div key={`img-${img.id}-${idx}`} className="flex items-center gap-3 px-4 py-2.5">
              <input
                id={`cb-img-${img.id}-${idx}`}
                type="checkbox"
                value={img.id}
                checked={selectedIds.has(img.id)}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleId(img.id);
                }}
                className="h-4 w-4 rounded border-surface-300 text-primary-600 dark:border-surface-600"
              />
              <label htmlFor={`cb-img-${img.id}-${idx}`} className="min-w-0 flex-1 cursor-pointer">
                <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-100">
                  {img.repository}:{img.tag}
                </p>
                <p className="text-xs text-surface-400">{img.created}</p>
              </label>
              <span className="text-sm text-surface-500">{formatBytes(img.size)}</span>
              <Badge variant={img.in_use ? "success" : "outline"} size="sm">
                {img.in_use ? "In Use" : "Unused"}
              </Badge>
            </div>
          ))}

        {activeTab === "containers" &&
          dockerInfo.containers.map((ctn, idx) => (
            <div key={`ctn-${ctn.id}-${idx}`} className="flex items-center gap-3 px-4 py-2.5">
              <input
                id={`cb-ctn-${ctn.id}-${idx}`}
                type="checkbox"
                value={ctn.id}
                checked={selectedIds.has(ctn.id)}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleId(ctn.id);
                }}
                className="h-4 w-4 rounded border-surface-300 text-primary-600 dark:border-surface-600"
              />
              <label htmlFor={`cb-ctn-${ctn.id}-${idx}`} className="min-w-0 flex-1 cursor-pointer">
                <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-100">
                  {ctn.name}
                </p>
                <p className="text-xs text-surface-400">{ctn.image}</p>
              </label>
              <span className="text-sm text-surface-500">{formatBytes(ctn.size)}</span>
              <Badge
                variant={ctn.status.includes("running") ? "success" : "outline"}
                size="sm"
              >
                {ctn.status.includes("running") ? "Running" : "Stopped"}
              </Badge>
            </div>
          ))}

        {activeTab === "volumes" &&
          dockerInfo.volumes.map((vol, idx) => (
            <div key={`vol-${vol.name}-${idx}`} className="flex items-center gap-3 px-4 py-2.5">
              <input
                id={`cb-vol-${vol.name}-${idx}`}
                type="checkbox"
                value={vol.name}
                checked={selectedIds.has(vol.name)}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleId(vol.name);
                }}
                className="h-4 w-4 rounded border-surface-300 text-primary-600 dark:border-surface-600"
              />
              <label htmlFor={`cb-vol-${vol.name}-${idx}`} className="min-w-0 flex-1 cursor-pointer">
                <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-100">
                  {vol.name}
                </p>
                <p className="text-xs text-surface-400">Driver: {vol.driver}</p>
              </label>
              <span className="text-sm text-surface-500">{formatBytes(vol.size)}</span>
              <Badge variant={vol.in_use ? "success" : "outline"} size="sm">
                {vol.in_use ? "In Use" : "Unused"}
              </Badge>
            </div>
          ))}
      </div>
    </Card>
  );
}
