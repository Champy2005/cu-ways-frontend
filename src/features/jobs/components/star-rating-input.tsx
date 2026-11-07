"use client";

import type { Ref } from "react";
import { Star } from "lucide-react";
import { STAR_RATINGS, ratingLabel, type StarRating } from "../review";

export const RATING_ERROR_ID = "review-rating-error";
const RATING_HELP_ID = "review-rating-help";

/**
 * Five native radios styled as stars, so arrow keys and screen readers work
 * as a normal radio group. Nothing is preselected. Choosing a star fills it
 * and every star before it, and the text states the rating.
 */
export function StarRatingInput({
  value,
  error,
  onChange,
  firstStarRef,
}: {
  value: StarRating | null;
  error?: string;
  onChange: (rating: StarRating) => void;
  firstStarRef?: Ref<HTMLInputElement>;
}) {
  const describedBy = error ? `${RATING_HELP_ID} ${RATING_ERROR_ID}` : RATING_HELP_ID;
  return (
    <fieldset aria-describedby={describedBy}>
      <legend className="text-sm font-semibold">
        Rating <span className="font-normal text-[var(--mk-muted)]">(required)</span>
      </legend>
      <div className="review-stars">
        {STAR_RATINGS.map((rating) => (
          <label
            key={rating}
            className="review-star"
            data-filled={value !== null && rating <= value}
          >
            <input
              ref={rating === 1 ? firstStarRef : undefined}
              type="radio"
              name="review-rating"
              value={rating}
              checked={value === rating}
              aria-label={`${rating} ${rating === 1 ? "star" : "stars"}`}
              aria-describedby={describedBy}
              onChange={() => onChange(rating)}
            />
            <Star aria-hidden="true" />
          </label>
        ))}
      </div>
      <p id={RATING_HELP_ID} className="pay-help" aria-live="polite">
        {value === null ? "Select 1 to 5 stars." : ratingLabel(value)}
      </p>
      <div aria-live="polite">
        {error && (
          <p id={RATING_ERROR_ID} className="pay-error">
            {error}
          </p>
        )}
      </div>
    </fieldset>
  );
}
