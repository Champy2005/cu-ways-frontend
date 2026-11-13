"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  RATING_STARS,
  reviewsHref,
  type RatingFilter,
} from "@/features/marketer-discovery/reviews";

type ReviewRatingFilterProps = {
  marketerID: number;
  rating: RatingFilter;
  refValue: string;
};

/** Applies immediately and resets to page 1; no Apply button. */
export function ReviewRatingFilter({ marketerID, rating, refValue }: ReviewRatingFilterProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const changed = useRef(false);

  useEffect(() => {
    if (!pending && changed.current) {
      changed.current = false;
      document.getElementById("reviews-heading")?.focus();
    }
  }, [pending]);

  return (
    <label className="block">
      <span className="sr-only">Filter by rating</span>
      <select
        key={rating}
        defaultValue={rating}
        aria-busy={pending}
        className="h-12 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        onChange={(event) => {
          const value = event.target.value;
          const next = RATING_STARS.find((star) => String(star) === value) ?? "all";
          changed.current = true;
          startTransition(() =>
            router.replace(reviewsHref(marketerID, { rating: next, page: 1 }, refValue), {
              scroll: false,
            }),
          );
        }}
      >
        <option value="all">All ratings</option>
        {RATING_STARS.map((star) => (
          <option key={star} value={star}>
            {star} {star === 1 ? "star" : "stars"}
          </option>
        ))}
      </select>
    </label>
  );
}

export function RetryReviewsButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      {pending ? "Trying again…" : "Try again"}
    </Button>
  );
}
