import { Card } from "@/components/ui/Card";
import { ThemeToggle } from "./ThemeToggle";
import { ProviderConfig } from "./ProviderConfig";
import { Palette, Bot, Info } from "lucide-react";

export function SettingsPage() {
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
                {["~/Documents", "~/Downloads", "~/Desktop"].map((dir) => (
                  <div
                    key={dir}
                    className="flex items-center justify-between rounded-lg border border-surface-200 px-3 py-2 dark:border-surface-700"
                  >
                    <span className="text-sm text-surface-700 dark:text-surface-300">
                      {dir}
                    </span>
                    <button className="text-xs text-red-500 hover:text-red-600">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button className="mt-2 text-sm text-primary-500 hover:text-primary-600">
                + Add directory
              </button>
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
                2026.02.0
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
