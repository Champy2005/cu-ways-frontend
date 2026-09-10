import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

type RatingStarsProps = {
  value: number;
  max?: number;
  className?: string;
  starClassName?: string;
};

/** Filled stars up to `value`; the remainder render faint, never empty outlines. */
export function RatingStars({ value, max = 5, className, starClassName }: RatingStarsProps) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {Array.from({ length: max }, (_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          className={cn(
            "size-3.5",
            index < Math.round(value) ? "fill-brand text-brand" : "fill-faint text-faint",
            starClassName,
          )}
        />
      ))}
    </span>
  );
}
