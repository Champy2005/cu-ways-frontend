import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type RegisterFieldProps = {
  id: string;
  label: string;
  error?: string;
  /**
   * Step 1: 10px SemiBold grey label, 2px above the input (479:2654).
   * Steps 2-3: 15px label (Medium on step 2, Regular on step 3).
   */
  variant: "compact" | "regular" | "regular-medium";
  className?: string;
  children: ReactNode;
};

/** The error sits under the input, right-aligned, without moving the next field (488:2040). */
export function RegisterField({
  id,
  label,
  error,
  variant,
  className,
  children,
}: RegisterFieldProps) {
  return (
    <div className={cn("relative flex flex-col", className)}>
      <label
        htmlFor={id}
        className={cn(
          variant === "compact"
            ? "mb-[2px] text-[10px] leading-[12px] font-semibold text-[var(--rg-label)]"
            : "mb-[7px] text-[15px] leading-[18px] text-[var(--rg-ink)]",
          variant === "regular-medium" && "font-medium",
          error && "text-[var(--rg-error)]",
        )}
      >
        {label}
      </label>
      {children}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="absolute top-full right-0 text-right text-[8.5px] leading-[10px] text-[var(--rg-error)]"
        >
          {error}
        </p>
      )}
    </div>
  );
}
