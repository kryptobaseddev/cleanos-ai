import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "./ThemeToggle";
import { ProviderConfig } from "./ProviderConfig";
import { UpdateChecker } from "./UpdateChecker";
import {
  getCurrentVersion,
  getSetting,
  setSetting,
} from "@/services/tauri-commands";
import { Palette, Bot, Download, Info, Plus, X } from "lucide-react";

const DEFAULT_DIRECTORIES = ["~/Documents", "~/Downloads", "~/Desktop"];
const SCAN_DIRS_KEY = "scan_directories";

export function SettingsPage() {
  const [version, setVersion] = useState("...");
  const [scanDirs, setScanDirs] = useState<string[]>(DEFAULT_DIRECTORIES);
  const [addingDir, setAddingDir] = useState(false);
  const [newDirPath, setNewDirPath] = useState("");

  useEffect(() => {
    getCurrentVersion().then(setVersion).catch(() => setVersion("unknown"));
  }, []);

  // Load saved scan directories on mount
  useEffect(() => {
    async function loadDirs() {
      try {
        const raw = await getSetting(SCAN_DIRS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setScanDirs(parsed);
          }
        }
      } catch {
        // Use defaults on failure (including when key doesn't exist yet)
      }
    }
    loadDirs();
  }, []);

  const persistDirs = useCallback(async (dirs: string[]) => {
    try {
      await setSetting(SCAN_DIRS_KEY, JSON.stringify(dirs));
    } catch {
      // fail silently
    }
  }, []);

  function handleRemoveDir(dir: string) {
    const updated = scanDirs.filter((d) => d !== dir);
    setScanDirs(updated);
    persistDirs(updated);
  }

  function handleAddDir() {
    const trimmed = newDirPath.trim();
    if (!trimmed || scanDirs.includes(trimmed)) return;
    const updated = [...scanDirs, trimmed];
    setScanDirs(updated);
    persistDirs(updated);
    setNewDirPath("");
    setAddingDir(false);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
          Settings
        </h1>
        <p className="mt-1 text-surface-500 dark:text-surface-400">
          Configure your CleanOS preferences and AI providers.
        </p>
      </div>

      {/* General */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Palette size={18} className="text-surface-400" />
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
            General
          </h2>
        </div>
        <Card>
          <div className="space-y-6">
            {/* Theme */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                  Theme
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  Choose your preferred appearance.
                </p>
              </div>
              <ThemeToggle />
            </div>

            {/* Scan Directories */}
            <div>
              <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                Scan Directories
              </p>
              <p className="mb-2 text-xs text-surface-500 dark:text-surface-400">
                Directories to include when scanning for files.
              </p>
              <div className="space-y-2">
                {scanDirs.map((dir) => (
                  <div
                    key={dir}
                    className="flex items-center justify-between rounded-lg border border-surface-200 px-3 py-2 dark:border-surface-700"
                  >
                    <span className="text-sm text-surface-700 dark:text-surface-300">
                      {dir}
                    </span>
                    <button
                      onClick={() => handleRemoveDir(dir)}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
                    >
                      <X size={12} />
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              {addingDir ? (
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    placeholder="e.g. ~/Projects"
                    value={newDirPath}
                    onChange={(e) => setNewDirPath(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddDir();
                      if (e.key === "Escape") {
                        setAddingDir(false);
                        setNewDirPath("");
                      }
                    }}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddDir}
                    disabled={!newDirPath.trim()}
                  >
                    Add
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAddingDir(false);
                      setNewDirPath("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingDir(true)}
                  className="mt-2 flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600"
                >
                  <Plus size={14} />
                  Add directory
                </button>
              )}
            </div>
          </div>
        </Card>
      </section>

      {/* AI Providers */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Bot size={18} className="text-surface-400" />
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
            AI Providers
          </h2>
        </div>
        <ProviderConfig />
      </section>

      {/* Updates */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Download size={18} className="text-surface-400" />
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
            Updates
          </h2>
        </div>
        <UpdateChecker />
      </section>

      {/* About */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Info size={18} className="text-surface-400" />
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
            About
          </h2>
        </div>
        <Card>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-surface-500 dark:text-surface-400">
                Version
              </span>
              <span className="text-sm font-medium text-surface-900 dark:text-surface-100">
                {version}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-surface-500 dark:text-surface-400">
                Built with
              </span>
              <span className="text-sm font-medium text-surface-900 dark:text-surface-100">
                Tauri v2 + React 19
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-surface-500 dark:text-surface-400">
                License
              </span>
              <span className="text-sm font-medium text-surface-900 dark:text-surface-100">
                MIT
              </span>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
