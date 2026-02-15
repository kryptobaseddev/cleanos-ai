import { invoke } from "@tauri-apps/api/core";
import type {
  FileInfo,
  SystemInfo,
  StorageBreakdown,
  DockerInfo,
  CleanupResult,
  PackageCacheInfo,
  AIAnalysis,
  UpdateInfo,
} from "@/types";

// File operations
export async function scanDirectory(path: string): Promise<FileInfo[]> {
  return invoke<FileInfo[]>("scan_directory", { path });
}

export async function getFileInfo(path: string): Promise<FileInfo> {
  return invoke<FileInfo>("get_file_info", { path });
}

export async function findDuplicates(path: string): Promise<FileInfo[][]> {
  return invoke<FileInfo[][]>("find_duplicates", { path });
}

// System operations
export async function getSystemInfo(): Promise<SystemInfo> {
  return invoke<SystemInfo>("get_system_info");
}

export async function getStorageBreakdown(): Promise<StorageBreakdown> {
  return invoke<StorageBreakdown>("get_storage_breakdown");
}

export async function getDockerInfo(): Promise<DockerInfo> {
  return invoke<DockerInfo>("get_docker_info");
}

export async function cleanDocker(target: string): Promise<CleanupResult> {
  return invoke<CleanupResult>("clean_docker", { target });
}

export async function getPackageCaches(): Promise<PackageCacheInfo[]> {
  return invoke<PackageCacheInfo[]>("get_package_caches");
}

export async function cleanPackageCache(
  manager: string,
): Promise<CleanupResult> {
  return invoke<CleanupResult>("clean_package_cache", { manager });
}

// Model discovery
export async function fetchAvailableModels(): Promise<string> {
  return invoke<string>("fetch_available_models");
}

// AI operations
export async function chatWithAi(
  provider: string,
  message: string,
  model?: string,
): Promise<string> {
  return invoke<string>("chat_with_ai", { provider, message, model });
}

export async function testAiConnection(
  provider: string,
  apiKey: string | null,
  model: string,
): Promise<boolean> {
  return invoke<boolean>("test_ai_connection", { provider, apiKey, model });
}

export async function analyzeFilesWithAi(
  provider: string,
  filePaths: string[],
): Promise<AIAnalysis[]> {
  return invoke<AIAnalysis[]>("analyze_files_with_ai", {
    provider,
    filePaths,
  });
}

// Credential operations
export async function storeApiKey(
  provider: string,
  key: string,
): Promise<void> {
  return invoke<void>("store_api_key", { provider, key });
}

export async function getApiKey(provider: string): Promise<string> {
  return invoke<string>("get_api_key", { provider });
}

export async function deleteApiKey(provider: string): Promise<void> {
  return invoke<void>("delete_api_key", { provider });
}

export async function hasApiKey(provider: string): Promise<boolean> {
  return invoke<boolean>("has_api_key", { provider });
}

// Log operations
export async function getLogInfo(): Promise<{
  name: string;
  size: number;
  path: string;
  file_count: number;
}> {
  return invoke("get_log_info");
}

export async function cleanLogs(): Promise<CleanupResult> {
  return invoke<CleanupResult>("clean_logs");
}

// Browser cache operations
export async function getBrowserCaches(): Promise<PackageCacheInfo[]> {
  return invoke<PackageCacheInfo[]>("get_browser_caches");
}

export async function cleanBrowserCache(
  browser: string,
): Promise<CleanupResult> {
  return invoke<CleanupResult>("clean_browser_cache", { browser });
}

// Settings
export async function getSetting(key: string): Promise<string> {
  return invoke<string>("get_setting", { key });
}

export async function setSetting(key: string, value: string): Promise<void> {
  return invoke<void>("set_setting", { key, value });
}

// Update operations
export async function checkForUpdates(): Promise<UpdateInfo | null> {
  return invoke<UpdateInfo | null>("check_for_updates");
}

export async function installUpdate(): Promise<void> {
  return invoke<void>("install_update");
}

export async function getCurrentVersion(): Promise<string> {
  return invoke<string>("get_current_version");
}
