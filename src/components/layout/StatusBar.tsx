import { useAppStore } from "@/stores/app-store";
import { useUpdateChecker } from "@/hooks/useUpdateChecker";
import { formatBytes } from "@/lib/utils";
import { Cpu, HardDrive, MemoryStick, Info } from "lucide-react";

export function StatusBar() {
  const { systemInfo } = useAppStore();
  const { currentVersion } = useUpdateChecker(false);

  const memPercent = systemInfo
    ? Math.round((systemInfo.memory_used / systemInfo.memory_total) * 100)
    : 0;
  const diskPercent = systemInfo
    ? Math.round((systemInfo.disk_used / systemInfo.disk_total) * 100)
    : 0;

  return (
    <footer className="flex h-7 shrink-0 items-center justify-between border-t border-surface-200 bg-surface-50 px-4 text-[11px] text-surface-500 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-400">
      {/* Left: version and system */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1">
          <Info size={12} />
          CleanOS AI v{currentVersion || "..."}
        </span>
        {systemInfo && (
          <>
            <span className="flex items-center gap-1">
              <Cpu size={12} />
              {systemInfo.hostname} &middot; {systemInfo.os}
            </span>
          </>
        )}
      </div>

      {/* Right: resource usage */}
      {systemInfo && (
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <MemoryStick size={12} />
            RAM: {formatBytes(systemInfo.memory_used)} /{" "}
            {formatBytes(systemInfo.memory_total)} ({memPercent}%)
          </span>
          <span className="flex items-center gap-1">
            <HardDrive size={12} />
            Disk: {formatBytes(systemInfo.disk_used)} /{" "}
            {formatBytes(systemInfo.disk_total)} ({diskPercent}%)
          </span>
        </div>
      )}
    </footer>
  );
}
