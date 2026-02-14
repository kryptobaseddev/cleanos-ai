import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  trend?: {
    direction: "up" | "down";
    value: string;
  };
  color?: "blue" | "green" | "amber" | "red" | "purple";
}

const iconBgClasses: Record<string, string> = {
  blue: "bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400",
  green:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
  amber:
    "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
  red: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
  purple:
    "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400",
};

export function StatCard({
  icon,
  title,
  value,
  subtitle,
  trend,
  color = "blue",
}: StatCardProps) {
  return (
    <Card hover className="flex items-start gap-4">
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
          iconBgClasses[color],
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-surface-500 dark:text-surface-400">
          {title}
        </p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            {value}
          </p>
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-medium",
                trend.direction === "up"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400",
              )}
            >
              {trend.direction === "up" ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
              {trend.value}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-0.5 text-xs text-surface-400 dark:text-surface-500">
            {subtitle}
          </p>
        )}
      </div>
    </Card>
  );
}
