import type { ReactNode } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type FilterChipProps = {
  label: ReactNode;
  selected?: boolean;
  onToggle?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
};

/**
 * The pill from the Figma filter sheet. Selected chips fill with the brand
 * colour; chips in the applied-filters row additionally carry a remove control.
 */
export function FilterChip({
  label,
  selected = false,
  onToggle,
  onRemove,
  removeLabel,
}: FilterChipProps) {
  const className = cn(
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-card transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
    selected ? "bg-brand text-brand-foreground" : "bg-background text-foreground hover:bg-muted",
  );

  if (onRemove) {
    return (
      <span className={className}>
        {label}
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="-mr-1 flex size-4 items-center justify-center rounded-full outline-none hover:bg-brand-foreground/20 focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <X className="size-3" aria-hidden="true" />
        </button>
      </span>
    );
  }

  return (
    <button type="button" onClick={onToggle} aria-pressed={selected} className={className}>
      {label}
    </button>
  );
}
