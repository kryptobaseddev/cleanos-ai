import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon, Monitor } from "lucide-react";

const options = [
  { value: "light" as const, label: "Light", icon: <Sun size={16} /> },
  { value: "dark" as const, label: "Dark", icon: <Moon size={16} /> },
  { value: "system" as const, label: "System", icon: <Monitor size={16} /> },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex rounded-lg border border-surface-300 dark:border-surface-600">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 first:rounded-l-lg last:rounded-r-lg",
            theme === opt.value
              ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
              : "text-surface-500 hover:bg-surface-50 dark:text-surface-400 dark:hover:bg-surface-800",
          )}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
