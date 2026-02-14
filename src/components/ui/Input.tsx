import { cn } from "@/lib/utils";
import { Eye, EyeOff, Search } from "lucide-react";
import { useState } from "react";

type InputVariant = "text" | "password" | "search";

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  variant?: InputVariant;
  label?: string;
  error?: string;
  iconLeft?: React.ReactNode;
}

export function Input({
  variant = "text",
  label,
  error,
  iconLeft,
  className,
  id,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  const resolvedType =
    variant === "password" ? (showPassword ? "text" : "password") : "text";

  const resolvedIcon =
    variant === "search" ? (
      <Search className="h-4 w-4 text-surface-400" />
    ) : (
      iconLeft
    );

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {resolvedIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            {resolvedIcon}
          </div>
        )}
        <input
          id={inputId}
          type={resolvedType}
          className={cn(
            "w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 placeholder-surface-400 transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100 dark:placeholder-surface-500 dark:focus:border-primary-400",
            resolvedIcon && "pl-9",
            variant === "password" && "pr-10",
            error &&
              "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            className,
          )}
          {...props}
        />
        {variant === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
