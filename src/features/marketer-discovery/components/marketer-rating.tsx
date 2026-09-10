import { Star } from "lucide-react";

import { RatingStars } from "@/features/marketer-discovery/components/rating-stars";
import { formatRating } from "@/features/marketer-discovery/format";
import { cn } from "@/lib/utils";

type MarketerRatingProps = {
  value: number | null;
  variant?: "compact" | "stat" | "stars";
  className?: string;
};

const NO_RATINGS_LABEL = "No ratings yet";

/**
 * Owns the US-015 "No ratings yet" state. A marketer with no qualifying reviews
 * renders the label rather than a zero — zero filled stars reads as a 0/5 score.
 * The value itself is always supplied by the backend; nothing is computed here.
 */
export function MarketerRating({ value, variant = "compact", className }: MarketerRatingProps) {
  const formatted = formatRating(value);

  if (formatted === null) {
    return (
      <span
        className={cn("text-muted-strong", variant === "stat" ? "text-sm" : "text-xs", className)}
      >
        {NO_RATINGS_LABEL}
      </span>
    );
  }

  if (variant === "stars") {
    return <RatingStars value={value ?? 0} className={className} />;
  }

  if (variant === "stat") {
    return (
      <span className={cn("flex items-baseline gap-1.5", className)}>
        <Star aria-hidden="true" className="size-5 shrink-0 translate-y-1 fill-brand text-brand" />
        <span className="text-2xl font-medium text-foreground">{formatted}</span>
        <span className="text-[11px] font-medium text-faint">/ 5.0</span>
      </span>
    );
  }

  return (
    <span className={cn("flex items-center gap-1", className)}>
      <Star aria-hidden="true" className="size-3.5 shrink-0 fill-brand text-brand" />
      <span className="text-xs font-medium text-foreground">{formatted}</span>
    </span>
  );
}
