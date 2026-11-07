import type { components } from "@/lib/api/generated/backend";

/** The job's saved review, as read back from the backend. */
export type SavedReview = components["schemas"]["JobReview"];

export const STAR_RATINGS = [1, 2, 3, 4, 5] as const;
export type StarRating = (typeof STAR_RATINGS)[number];

export const RATING_REQUIRED = "Choose a rating from 1 to 5 stars.";

export function isStarRating(value: unknown): value is StarRating {
  return typeof value === "number" && (STAR_RATINGS as readonly number[]).includes(value);
}

/** "4 out of 5 stars", so the choice never depends on star colour alone. */
export function ratingLabel(rating: number): string {
  return `${rating} out of 5 ${rating === 1 ? "star" : "stars"}`;
}

/**
 * The comment exactly as it will be sent: surrounding whitespace trimmed,
 * inner line breaks kept. An empty comment is sent as null.
 */
export function normalizeComment(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function isTime(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

/**
 * Checks a backend review so a malformed response is never shown as real.
 * Ratings 1 to 5 are current; 0 can appear only on legacy reviews.
 */
export function isSavedReview(value: unknown, jobId: number): value is SavedReview {
  if (typeof value !== "object" || value === null) return false;
  const review = value as Record<string, unknown>;
  return (
    typeof review.review_id === "number" &&
    Number.isSafeInteger(review.review_id) &&
    review.review_id > 0 &&
    review.job_id === jobId &&
    typeof review.rating === "number" &&
    Number.isInteger(review.rating) &&
    review.rating >= 0 &&
    review.rating <= 5 &&
    (review.comment === null || typeof review.comment === "string") &&
    isTime(review.created_at)
  );
}
