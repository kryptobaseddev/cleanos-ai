import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import {
  LayoutDashboard,
  FolderOpen,
  HardDrive,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Cpu,
} from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { AppView } from "@/types";

interface NavItem {
  id: AppView;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
  { id: "files", label: "Files", icon: <FolderOpen size={20} /> },
  { id: "system", label: "System Cleanup", icon: <HardDrive size={20} /> },
  { id: "ai-chat", label: "AI Chat", icon: <MessageSquare size={20} /> },
  { id: "settings", label: "Settings", icon: <Settings size={20} /> },
];

export function Sidebar() {
  const {
    currentView,
    setCurrentView,
    sidebarCollapsed,
    toggleSidebar,
    systemInfo,
  } = useAppStore();

  const diskUsed = systemInfo?.disk_used ?? 0;
  const diskTotal = systemInfo?.disk_total ?? 1;
  const diskPercent = Math.round((diskUsed / diskTotal) * 100);
  const diskVariant =
    diskPercent > 90 ? "danger" : diskPercent > 75 ? "warning" : "primary";

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-surface-200 bg-white transition-all duration-200 dark:border-surface-700 dark:bg-surface-900",
        sidebarCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center gap-3 border-b border-surface-200 px-4 dark:border-surface-700">
        <Cpu size={24} className="shrink-0 text-primary-500" />
        {!sidebarCollapsed && (
          <span className="text-lg font-bold text-surface-900 dark:text-surface-50">
            CleanOS
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-3">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            title={sidebarCollapsed ? item.label : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              currentView === item.id
                ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                : "text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800",
              sidebarCollapsed && "justify-center px-0",
            )}
          >
            <span className="shrink-0">{item.icon}</span>
            {!sidebarCollapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Disk Usage */}
      {!sidebarCollapsed && systemInfo && (
        <div className="border-t border-surface-200 px-4 py-3 dark:border-surface-700">
          <div className="mb-1.5 flex items-center justify-between text-xs text-surface-500 dark:text-surface-400">
            <span>Disk Usage</span>
            <span>
              {formatBytes(diskUsed)} / {formatBytes(diskTotal)}
            </span>
          </div>
          <ProgressBar
            value={diskUsed}
            max={diskTotal}
            variant={diskVariant}
            size="sm"
          />
        </div>
      )}

      {/* Collapse Toggle */}
      <div className="border-t border-surface-200 px-2 py-2 dark:border-surface-700">
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center rounded-lg p-2 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"
        >
          {sidebarCollapsed ? (
            <ChevronRight size={18} />
          ) : (
            <ChevronLeft size={18} />
          )}
        </button>
      </div>
    </aside>
  );
}
