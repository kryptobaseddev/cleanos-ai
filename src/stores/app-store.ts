/**
 * @epic T001
 * @what Main application state store using Zustand
 */
import { create } from "zustand";
import type {
  AppView,
  FileInfo,
  SystemInfo,
  StorageBreakdown,
  CleanupRecommendation,
  ProviderStatus,
  ScanProgress,
  DockerInfo,
  PackageCacheInfo,
} from "@/types";

interface AppState {
  // UI State
  theme: "light" | "dark" | "system";
  currentView: AppView;
  sidebarCollapsed: boolean;

  // File Management
  scannedFiles: FileInfo[];
  selectedFiles: Set<string>;
  scanProgress: ScanProgress | null;
  isScanning: boolean;

  // System State
  systemInfo: SystemInfo | null;
  storageBreakdown: StorageBreakdown | null;
  dockerInfo: DockerInfo | null;
  packageCaches: PackageCacheInfo[];
  cleanupRecommendations: CleanupRecommendation[];

  // AI State
  providers: ProviderStatus[];
  activeProvider: string | null;

  // Actions
  setTheme: (theme: "light" | "dark" | "system") => void;
  setCurrentView: (view: AppView) => void;
  toggleSidebar: () => void;
  setScannedFiles: (files: FileInfo[]) => void;
  toggleFileSelection: (fileId: string) => void;
  selectAllFiles: () => void;
  deselectAllFiles: () => void;
  setScanProgress: (progress: ScanProgress | null) => void;
  setIsScanning: (scanning: boolean) => void;
  setSystemInfo: (info: SystemInfo) => void;
  setStorageBreakdown: (breakdown: StorageBreakdown) => void;
  setDockerInfo: (info: DockerInfo) => void;
  setPackageCaches: (caches: PackageCacheInfo[]) => void;
  setCleanupRecommendations: (recs: CleanupRecommendation[]) => void;
  setProviders: (providers: ProviderStatus[]) => void;
  setActiveProvider: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial UI state
  theme: "dark",
  currentView: "dashboard",
  sidebarCollapsed: false,

  // Initial file state
  scannedFiles: [],
  selectedFiles: new Set(),
  scanProgress: null,
  isScanning: false,

  // Initial system state
  systemInfo: null,
  storageBreakdown: null,
  dockerInfo: null,
  packageCaches: [],
  cleanupRecommendations: [],

  // Initial AI state
  providers: [],
  activeProvider: null,

  // Actions
  setTheme: (theme) => {
    set({ theme });
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  },
  setCurrentView: (currentView) => set({ currentView }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setScannedFiles: (scannedFiles) => set({ scannedFiles }),
  toggleFileSelection: (fileId) =>
    set((state) => {
      const next = new Set(state.selectedFiles);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return { selectedFiles: next };
    }),
  selectAllFiles: () =>
    set((state) => ({
      selectedFiles: new Set(state.scannedFiles.map((f) => f.id)),
    })),
  deselectAllFiles: () => set({ selectedFiles: new Set() }),
  setScanProgress: (scanProgress) => set({ scanProgress }),
  setIsScanning: (isScanning) => set({ isScanning }),
  setSystemInfo: (systemInfo) => set({ systemInfo }),
  setStorageBreakdown: (storageBreakdown) => set({ storageBreakdown }),
  setDockerInfo: (dockerInfo) => set({ dockerInfo }),
  setPackageCaches: (packageCaches) => set({ packageCaches }),
  setCleanupRecommendations: (cleanupRecommendations) =>
    set({ cleanupRecommendations }),
  setProviders: (providers) => set({ providers }),
  setActiveProvider: (activeProvider) => set({ activeProvider }),
}));
