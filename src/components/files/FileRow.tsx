import { cn } from "@/lib/utils";
import { formatBytes, formatDate, getCategoryColor } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { FileInfo } from "@/types";
import {
  FileText,
  Image,
  Code2,
  Archive,
  Settings,
  File,
  Folder,
} from "lucide-react";

interface FileRowProps {
  file: FileInfo;
  selected: boolean;
  onToggleSelect: (id: string) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  document: <FileText size={18} className="text-blue-500" />,
  media: <Image size={18} className="text-purple-500" />,
  code: <Code2 size={18} className="text-emerald-500" />,
  archive: <Archive size={18} className="text-amber-500" />,
  system: <Settings size={18} className="text-red-500" />,
  other: <File size={18} className="text-surface-400" />,
};

export function FileRow({ file, selected, onToggleSelect }: FileRowProps) {
  const icon = file.is_directory ? (
    <Folder size={18} className="text-amber-400" />
  ) : (
    categoryIcons[file.category || "other"]
  );

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all duration-150",
        selected
          ? "border-primary-300 bg-primary-50 dark:border-primary-700 dark:bg-primary-900/20"
          : "border-transparent hover:bg-surface-50 dark:hover:bg-surface-800/50",
      )}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleSelect(file.id)}
        className="h-4 w-4 shrink-0 rounded border-surface-300 text-primary-600 focus:ring-primary-500 dark:border-surface-600"
      />
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-100">
          {file.name}
        </p>
        <p className="truncate text-xs text-surface-400 dark:text-surface-500">
          {file.path}
        </p>
      </div>
      <span className="shrink-0 text-sm text-surface-500 dark:text-surface-400">
        {formatBytes(file.size)}
      </span>
      <span className="hidden shrink-0 text-sm text-surface-400 dark:text-surface-500 md:block">
        {formatDate(file.modified_at)}
      </span>
      {file.category && (
        <Badge
          variant="outline"
          size="sm"
          className="hidden shrink-0 lg:inline-flex"
        >
          <span
            className="mr-1 inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: getCategoryColor(file.category) }}
          />
          {file.category}
        </Badge>
      )}
      {file.importance_score !== undefined && (
        <span
          className={cn(
            "hidden shrink-0 text-xs font-medium xl:block",
            file.importance_score > 0.7
              ? "text-emerald-600 dark:text-emerald-400"
              : file.importance_score > 0.3
                ? "text-amber-600 dark:text-amber-400"
                : "text-red-600 dark:text-red-400",
          )}
        >
          {Math.round(file.importance_score * 100)}%
        </span>
      )}
    </div>
  );
}
