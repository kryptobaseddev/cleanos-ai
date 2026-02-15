/**
 * @epic T001
 * @what Core TypeScript type definitions for CleanOS AI
 */

// File system types
export interface FileInfo {
  id: string;
  path: string;
  name: string;
  size: number;
  modified_at: number;
  hash?: string;
  category?: FileCategory;
  importance_score?: number;
  ai_analysis?: AIAnalysis;
  is_directory: boolean;
  extension?: string;
}

export type FileCategory =
  | "document"
  | "media"
  | "code"
  | "archive"
  | "system"
  | "other";

export interface AIAnalysis {
  category: FileCategory;
  importance: number;
  action: "keep" | "review" | "delete" | "move";
  suggested_location?: string;
  confidence: number;
  summary?: string;
}

// Scan types
export interface ScanResult {
  id: number;
  started_at: number;
  completed_at?: number;
  files_found: number;
  total_size: number;
  status: "running" | "completed" | "failed";
}

export interface ScanProgress {
  total_files: number;
  scanned_files: number;
  current_path: string;
  bytes_scanned: number;
}

// System info types
export interface SystemInfo {
  hostname: string;
  os: string;
  kernel: string;
  memory_total: number;
  memory_used: number;
  memory_available: number;
  disk_total: number;
  disk_used: number;
  disk_available: number;
}

export interface StorageBreakdown {
  categories: StorageCategory[];
  total_used: number;
  total_available: number;
}

export interface StorageCategory {
  name: string;
  size: number;
  path: string;
  file_count: number;
}

// Docker types
export interface DockerInfo {
  images: DockerImage[];
  containers: DockerContainer[];
  volumes: DockerVolume[];
  build_cache_size: number;
}

export interface DockerImage {
  id: string;
  repository: string;
  tag: string;
  size: number;
  created: string;
  in_use: boolean;
}

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  created: string;
  size: number;
}

export interface DockerVolume {
  name: string;
  driver: string;
  size: number;
  in_use: boolean;
}

// Package cache types
export interface PackageCacheInfo {
  manager: string;
  path: string;
  size: number;
  exists: boolean;
}

// Cleanup types
export interface CleanupRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  space_reclaimable: number;
  risk_level: "low" | "medium" | "high";
  items: CleanupItem[];
}

export interface CleanupItem {
  path: string;
  size: number;
  description: string;
  selected: boolean;
}

export interface CleanupResult {
  success: boolean;
  space_freed: number;
  message: string;
}

// AI Provider types
export type AuthType = "api" | "oauth" | "token";

export interface AIProviderDefinition {
  id: string;
  name: string;
  description: string;
  logo?: string;
  auth_methods: AuthMethod[];
  default_model: string;
  models: ModelDefinition[];
  capabilities: ProviderCapabilities;
}

export interface AuthMethod {
  type: AuthType;
  label: string;
  description?: string;
  key_placeholder?: string;
  help_url?: string;
}

export interface ModelDefinition {
  id: string;
  name: string;
  description: string;
  max_tokens: number;
  cost_per_1k_input?: number;
  cost_per_1k_output?: number;
  capabilities: string[];
}

export interface ProviderCapabilities {
  chat: boolean;
  vision: boolean;
  json: boolean;
  streaming: boolean;
  tools: boolean;
}

export interface ProviderStatus {
  id: string;
  connected: boolean;
  model: string;
  error?: string;
}

// Settings types
export interface AppSettings {
  theme: "light" | "dark" | "system";
  scan_directories: string[];
  default_provider: string | null;
  auto_scan: boolean;
  notifications: boolean;
}

// Update types
export interface UpdateInfo {
  version: string;
  date: string;
  body: string;
}

// View types
export type AppView =
  | "dashboard"
  | "files"
  | "system"
  | "ai-chat"
  | "settings";
