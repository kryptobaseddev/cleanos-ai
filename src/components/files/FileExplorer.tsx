import { useState } from "react";
import { useAppStore } from "@/stores/app-store";
import { formatBytes } from "@/lib/utils";
import { scanDirectory } from "@/services/tauri-commands";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { FileRow } from "./FileRow";
import type { FileCategory } from "@/types";
import {
  Scan,
  List,
  Grid3x3,
  Trash2,
  FolderInput,
  Sparkles,
  ChevronRight,
  Home,
} from "lucide-react";

type SortField = "name" | "size" | "modified_at";
type SortDir = "asc" | "desc";

export function FileExplorer() {
  const {
    scannedFiles,
    selectedFiles,
    toggleFileSelection,
    selectAllFiles,
    deselectAllFiles,
    setScannedFiles,
    isScanning,
    setIsScanning,
  } = useAppStore();

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [categoryFilter, setCategoryFilter] = useState<FileCategory | "all">(
    "all",
  );
  const [currentPath, setCurrentPath] = useState("~");

  const categories: Array<FileCategory | "all"> = [
    "all",
    "document",
    "media",
    "code",
    "archive",
    "system",
    "other",
  ];

  const filtered = scannedFiles
    .filter((f) => {
      if (search && !f.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (categoryFilter !== "all" && f.category !== categoryFilter)
        return false;
      return true;
    })
    .sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortField === "name") return a.name.localeCompare(b.name) * mul;
      if (sortField === "size") return (a.size - b.size) * mul;
      return (a.modified_at - b.modified_at) * mul;
    });

  const hasSelection = selectedFiles.size > 0;

  async function handleScan() {
    setIsScanning(true);
    try {
      const files = await scanDirectory(currentPath);
      setScannedFiles(files);
    } catch {
      // Tauri command not available in dev; fail silently
    } finally {
      setIsScanning(false);
    }
  }

  const pathParts = currentPath.split("/").filter(Boolean);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
          File Explorer
        </h1>
        <Button
          variant="primary"
          iconLeft={<Scan size={16} />}
          loading={isScanning}
          onClick={handleScan}
        >
          {isScanning ? "Scanning..." : "Scan Directory"}
        </Button>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-surface-500 dark:text-surface-400">
        <button
          onClick={() => setCurrentPath("~")}
          className="flex items-center hover:text-primary-500"
        >
          <Home size={14} />
        </button>
        {pathParts.map((part, i) => (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight size={12} />
            <button
              onClick={() =>
                setCurrentPath("/" + pathParts.slice(0, i + 1).join("/"))
              }
              className="hover:text-primary-500"
            >
              {part}
            </button>
          </span>
        ))}
      </div>

      {/* Toolbar */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-64">
            <Input
              variant="search"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg border border-surface-300 dark:border-surface-600">
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-l-lg p-2 ${viewMode === "list" ? "bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400" : "text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800"}`}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-r-lg p-2 ${viewMode === "grid" ? "bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400" : "text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800"}`}
            >
              <Grid3x3 size={16} />
            </button>
          </div>

          {/* Sort */}
          <select
            value={`${sortField}-${sortDir}`}
            onChange={(e) => {
              const [field, dir] = e.target.value.split("-") as [
                SortField,
                SortDir,
              ];
              setSortField(field);
              setSortDir(dir);
            }}
            className="rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-700 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300"
          >
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="size-desc">Largest first</option>
            <option value="size-asc">Smallest first</option>
            <option value="modified_at-desc">Newest first</option>
            <option value="modified_at-asc">Oldest first</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as FileCategory | "all")
            }
            className="rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-700 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "all" ? "All Categories" : cat}
              </option>
            ))}
          </select>

          <span className="ml-auto text-sm text-surface-400">
            {filtered.length} file{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </Card>

      {/* Bulk Actions */}
      {hasSelection && (
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
              {selectedFiles.size} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                selectedFiles.size === scannedFiles.length
                  ? deselectAllFiles()
                  : selectAllFiles()
              }
            >
              {selectedFiles.size === scannedFiles.length
                ? "Deselect All"
                : "Select All"}
            </Button>
            <div className="mx-2 h-4 w-px bg-surface-300 dark:bg-surface-600" />
            <Button
              variant="danger"
              size="sm"
              iconLeft={<Trash2 size={14} />}
            >
              Delete
            </Button>
            <Button
              variant="outline"
              size="sm"
              iconLeft={<FolderInput size={14} />}
            >
              Move
            </Button>
            <Button
              variant="outline"
              size="sm"
              iconLeft={<Sparkles size={14} />}
            >
              Analyze with AI
            </Button>
          </div>
        </Card>
      )}

      {/* File List */}
      {viewMode === "list" ? (
        <div className="space-y-1">
          {filtered.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center justify-center py-12 text-surface-400">
                <Scan size={40} className="mb-3" />
                <p className="text-lg font-medium">No files found</p>
                <p className="text-sm">
                  Scan a directory to see your files here.
                </p>
              </div>
            </Card>
          ) : (
            filtered.map((file) => (
              <FileRow
                key={file.id}
                file={file}
                selected={selectedFiles.has(file.id)}
                onToggleSelect={toggleFileSelection}
              />
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((file) => (
            <Card
              key={file.id}
              hover
              padding="sm"
              className={
                selectedFiles.has(file.id)
                  ? "ring-2 ring-primary-500"
                  : undefined
              }
            >
              <button
                onClick={() => toggleFileSelection(file.id)}
                className="flex w-full flex-col items-center gap-2 py-2 text-center"
              >
                <div className="text-surface-400">
                  {file.is_directory ? (
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-amber-400"
                    >
                      <path d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                  ) : (
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14,2 14,8 20,8" />
                    </svg>
                  )}
                </div>
                <p className="w-full truncate text-xs font-medium text-surface-700 dark:text-surface-300">
                  {file.name}
                </p>
                <p className="text-xs text-surface-400">
                  {file.is_directory ? "Folder" : formatBytes(file.size)}
                </p>
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

