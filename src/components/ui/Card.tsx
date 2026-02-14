import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function Card({
  children,
  className,
  hover = false,
  padding = "md",
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-surface-200 bg-white shadow-sm dark:border-surface-700 dark:bg-surface-800",
        hover && "transition-shadow duration-200 hover:shadow-md",
        paddingClasses[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div
      className={cn(
        "border-b border-surface-200 px-4 py-3 dark:border-surface-700",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div
      className={cn(
        "border-t border-surface-200 px-4 py-3 dark:border-surface-700",
        className,
      )}
    >
      {children}
    </div>
  );
}
