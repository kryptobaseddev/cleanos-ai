import { cn } from "@/lib/utils";

type ProgressVariant = "primary" | "success" | "warning" | "danger";
type ProgressSize = "sm" | "md" | "lg";

interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: ProgressVariant;
  size?: ProgressSize;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

const variantClasses: Record<ProgressVariant, string> = {
  primary: "bg-primary-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

const trackClasses: Record<ProgressSize, string> = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export function ProgressBar({
  value,
  max = 100,
  variant = "primary",
  size = "md",
  label,
  showPercentage = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);

  return (
    <div className={cn("w-full", className)}>
      {(label || showPercentage) && (
        <div className="mb-1 flex items-center justify-between text-sm">
          {label && (
            <span className="font-medium text-surface-700 dark:text-surface-300">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-surface-500 dark:text-surface-400">
              {percentage}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-surface-200 dark:bg-surface-700",
          trackClasses[size],
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            variantClasses[variant],
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
