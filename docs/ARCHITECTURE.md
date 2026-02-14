# CleanOS AI - Architecture Design Document

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CleanOS AI Desktop App                    │
│                     (Tauri + React + TypeScript)                │
└──────────────────┬──────────────────────────────────────────────┘
                   │ IPC (Tauri Commands)
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Rust Backend (Tauri)                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ File System  │ │ AI Client    │ │ System Tools │            │
│  │ Manager      │ │ Manager      │ │ Module       │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
└──────────────────┬──────────────────────────────────────────────┘
                   │
         ┌─────────┴──────────┐
         ▼                    ▼
┌──────────────┐      ┌──────────────┐
│  SQLite DB   │      │  External    │
│  (Local)     │      │  AI APIs     │
└──────────────┘      └──────────────┘
```

## Technology Stack Decisions

### 1. Desktop Framework: Tauri (Rust)
**Why Tauri over Electron?**
- Smaller bundle size (~600KB vs ~150MB)
- Better memory usage
- Native system integration
- Security-focused design
- Rust's performance for system operations

### 2. Frontend: React + TypeScript
**Why React?**
- Component-based architecture
- Large ecosystem
- Excellent developer experience
- Strong TypeScript support
- Headless UI accessibility

### 3. State Management: Zustand
**Why Zustand over Redux?**
- Simpler API
- Smaller bundle
- No boilerplate
- Excellent TypeScript support
- Async actions built-in

### 4. Styling: Tailwind CSS
**Why Tailwind?**
- Utility-first approach
- Consistent design system
- Dark mode support
- Small bundle size with purge
- Customizable theme

### 5. Charts: Recharts
**Why Recharts?**
- React-native
- Responsive
- Customizable
- Good TypeScript support
- Interactive features

## Directory Structure

```
cleanos-ai/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Primitive UI components
│   │   ├── dashboard/      # Dashboard views
│   │   ├── files/          # File management
│   │   ├── system/         # System tools
│   │   └── settings/       # Settings views
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # Zustand stores
│   ├── lib/                # Utility functions
│   ├── services/           # API services
│   │   ├── ai/            # AI provider clients
│   │   └── system/        # System integration
│   ├── types/              # TypeScript types
│   └── App.tsx            # Main app component
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs        # Entry point
│   │   ├── commands.rs    # Tauri commands
│   │   ├── filesystem.rs  # File operations
│   │   ├── ai_client.rs   # AI integration
│   │   └── system.rs      # System tools
│   └── Cargo.toml
├── docs/                   # Documentation
├── tests/                  # Test files
└── package.json
```

## Core Modules

### 1. File System Manager
**Responsibilities:**
- Scan directories recursively
- Calculate file hashes
- Extract file metadata
- Monitor file changes
- Batch operations

**Key Functions:**
```rust
// Rust side
scan_directory(path: String) -> Vec<FileInfo>
calculate_hash(path: String) -> String
move_files(operations: Vec<MoveOp>) -> Result
watch_directory(path: String) -> WatchHandle
```

### 2. AI Client Manager
**Responsibilities:**
- Manage multiple AI providers
- Handle authentication
- Rate limiting
- Request batching
- Caching responses

**Supported Providers:**
```typescript
interface AIProvider {
  name: 'openai' | 'gemini' | 'claude' | 'kimi';
  authenticate(credentials: Credentials): Promise<void>;
  analyzeFile(file: FileInfo): Promise<AnalysisResult>;
  categorizeFiles(files: FileInfo[]): Promise<Category[]>;
}
```

### 3. System Tools Module
**Responsibilities:**
- Docker management
- Package cache cleanup
- Log rotation
- Kernel management
- Browser cache cleanup

**Key Functions:**
```rust
get_docker_info() -> DockerInfo
clean_docker_volumes() -> Result
clean_docker_cache() -> Result
get_package_cache_size() -> HashMap<String, u64>
clean_package_cache(manager: String) -> Result
get_old_kernels() -> Vec<Kernel>
remove_kernel(version: String) -> Result
```

### 4. Database Layer
**Schema:**
```sql
-- Files table
CREATE TABLE files (
  id TEXT PRIMARY KEY,
  path TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  size INTEGER NOT NULL,
  modified_at INTEGER NOT NULL,
  hash TEXT,
  category TEXT,
  importance_score REAL,
  ai_analysis TEXT,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP
);

-- Scan history
CREATE TABLE scans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  files_found INTEGER,
  space_analyzed INTEGER,
  status TEXT
);

-- Cleanup operations
CREATE TABLE cleanups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  space_freed INTEGER,
  operations TEXT, -- JSON array
  status TEXT
);

-- Settings
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

## IPC Communication (Tauri Commands)

### File Operations
```rust
#[tauri::command]
async fn scan_directory(path: String) -> Result<Vec<FileInfo>, String>

#[tauri::command]
async fn organize_files(operations: Vec<MoveOperation>) -> Result<(), String>

#[tauri::command]
async fn undo_last_operation() -> Result<(), String>
```

### AI Operations
```rust
#[tauri::command]
async fn analyze_with_ai(file_path: String) -> Result<AIAnalysis, String>

#[tauri::command]
async fn get_cleanup_recommendations() -> Result<Vec<Recommendation>, String>

#[tauri::command]
async fn test_ai_connection(provider: String) -> Result<bool, String>
```

### System Operations
```rust
#[tauri::command]
async fn get_system_info() -> Result<SystemInfo, String>

#[tauri::command]
async fn clean_docker() -> Result<CleanupResult, String>

#[tauri::command]
async fn get_storage_breakdown() -> Result<StorageBreakdown, String>
```

## State Management

### Global Store (Zustand)
```typescript
interface AppState {
  // UI State
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  currentView: View;
  
  // File Management
  scannedFiles: FileInfo[];
  selectedFiles: Set<string>;
  organizationQueue: MoveOperation[];
  
  // AI State
  aiProviders: AIProviderConfig[];
  activeProvider: string | null;
  aiRateLimits: RateLimitInfo;
  
  // System State
  systemInfo: SystemInfo | null;
  cleanupRecommendations: Recommendation[];
  
  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  scanDirectory: (path: string) => Promise<void>;
  organizeFiles: () => Promise<void>;
  addAIProvider: (config: AIProviderConfig) => void;
  runCleanup: (recommendation: Recommendation) => Promise<void>;
}
```

## AI Integration Architecture

### Provider Abstraction
```typescript
abstract class AIProvider {
  protected apiKey: string;
  protected baseUrl: string;
  
  abstract authenticate(credentials: Credentials): Promise<void>;
  abstract analyzeFile(file: FileInfo): Promise<AnalysisResult>;
  abstract categorizeBatch(files: FileInfo[]): Promise<CategoryResult[]>;
  abstract getRateLimit(): Promise<RateLimitInfo>;
  
  // Shared functionality
  protected async makeRequest(payload: unknown): Promise<unknown> {
    // Rate limiting, retry logic, error handling
  }
}

class OpenAIProvider extends AIProvider {
  // OpenAI-specific implementation
}

class GeminiProvider extends AIProvider {
  // Gemini-specific implementation
}

class ClaudeProvider extends AIProvider {
  // Claude-specific implementation
}

class KimiProvider extends AIProvider {
  // Kimi-specific implementation
}
```

### Prompt Templates
```typescript
const PROMPTS = {
  fileAnalysis: (file: FileInfo) => `
    Analyze this file:
    Path: ${file.path}
    Size: ${formatBytes(file.size)}
    Extension: ${file.extension}
    Modified: ${formatDate(file.modifiedAt)}
    
    Provide JSON response:
    {
      "category": "document|media|code|archive|system|other",
      "importance": 1-10,
      "action": "keep|review|delete|move",
      "suggestedLocation": "path/to/folder",
      "confidence": 0.0-1.0
    }
  `,
  
  cleanupRecommendation: (stats: SystemStats) => `
    System Analysis:
    Docker: ${stats.docker.images} images, ${stats.docker.cache}GB cache
    Package caches: ${formatBytes(stats.cache.npm)} npm
    Logs: ${stats.logs.size}GB
    
    Generate cleanup recommendations as JSON array.
  `
};
```

## Security Considerations

### 1. API Key Storage
- Store in Linux keyring (GNOME Keyring/KWallet/libsecret)
- Never log or expose keys
- Encrypt at rest

### 2. File Operations
- Verify paths before operations
- Prevent directory traversal attacks
- Use Rust's safe file APIs
- Create backups before destructive operations

### 3. System Access
- Request user confirmation for system-level changes
- Use sudo only when necessary
- Clear error messages for permission issues

## Performance Optimizations

### 1. File Scanning
- Use rayon for parallel directory traversal
- Batch file metadata operations
- Implement incremental scanning

### 2. AI Requests
- Batch multiple files into single requests
- Implement intelligent caching
- Use streaming for large responses
- Implement request deduplication

### 3. UI Performance
- Virtual scrolling for large file lists
- Debounce search inputs
- Lazy load heavy components
- Use React.memo for expensive renders

## Testing Strategy

### Unit Tests (Rust)
- File system operations
- Hash calculation
- AI client mocking

### Integration Tests (Rust + TypeScript)
- Tauri command testing
- Database operations
- AI provider integration

### E2E Tests (Playwright)
- User workflows
- UI interactions
- Cross-platform testing

## Deployment

### Build Targets
- .deb (Ubuntu/Debian)
- .rpm (Fedora/RHEL)
- AppImage (Universal Linux)
- Flatpak (Universal with sandboxing)

### Distribution
- GitHub Releases
- Flathub
- Snap Store (optional)

## Future Architecture Considerations

### Plugin System
```rust
trait CleanupPlugin {
  fn name(&self) -> String;
  fn scan(&self) -> Vec<CleanupItem>;
  fn clean(&self, items: Vec<CleanupItem>) -> Result;
}
```

### Remote Management
- WebSocket connection for remote monitoring
- REST API for headless operation
- Multi-system dashboard

### ML Model Training
- Optional local model training
- Federated learning on user patterns
- Custom categorization rules

---

**Document Version**: 1.0
**Last Updated**: 2026-02-14
**Status**: Draft
