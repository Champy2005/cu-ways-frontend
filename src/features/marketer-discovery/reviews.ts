import type { MarketerReview } from "@/features/marketer-discovery/types";

export const REVIEW_PAGE_SIZE = 5;
/** Comments longer than this show a preview with a native "Read full review" disclosure. */
export const REVIEW_COMMENT_LIMIT = 420;
const PREVIEW_LENGTH = 240;
const PREVIEW_MIN_CUT = 160;
const MAX_PAGE = 100_000;

export const RATING_STARS = [5, 4, 3, 2, 1] as const;
export type RatingStar = (typeof RATING_STARS)[number];
export type RatingFilter = "all" | RatingStar;

type RawValue = string | string[] | undefined;

function first(raw: RawValue): string {
  return (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
}

/** Total by construction: unknown ratings fall back to all, bad pages to page 1. */
export function parseReviewParams(raw: { rating?: RawValue; page?: RawValue }): {
  rating: RatingFilter;
  page: number;
} {
  const star = RATING_STARS.find((value) => String(value) === first(raw.rating));
  const text = first(raw.page);
  const page = /^[1-9]\d{0,5}$/.test(text) ? Math.min(Number(text), MAX_PAGE) : 1;
  return { rating: star ?? "all", page };
}

export function reviewsHref(
  marketerID: number,
  { rating, page }: { rating: RatingFilter; page: number },
  ref: RawValue,
): string {
  const query = new URLSearchParams();
  const origin = first(ref);
  if (origin && origin !== "marketer-dashboard") query.set("ref", origin);
  if (rating !== "all") query.set("rating", String(rating));
  if (page > 1) query.set("page", String(page));
  const search = query.toString();
  const path =
    origin === "marketer-dashboard"
      ? "/marketer/reviews"
      : `/marketers/${marketerID}/verified-performance`;
  return `${path}${search ? `?${search}` : ""}`;
}

export function ratingDistribution(reviews: MarketerReview[]) {
  return RATING_STARS.map((star) => ({
    star,
    count: reviews.filter((review) => review.rating === star).length,
  }));
}

export function filterReviews(reviews: MarketerReview[], rating: RatingFilter) {
  return rating === "all" ? reviews : reviews.filter((review) => review.rating === rating);
}

/** The requested page, clamped into range so a stale link never shows nothing. */
export function paginateReviews(reviews: MarketerReview[], requested: number) {
  const pages = Math.max(1, Math.ceil(reviews.length / REVIEW_PAGE_SIZE));
  const page = Math.min(Math.max(1, requested), pages);
  const start = (page - 1) * REVIEW_PAGE_SIZE;
  return { page, pages, items: reviews.slice(start, start + REVIEW_PAGE_SIZE) };
}

function graphemes(text: string): string[] {
  return Array.from(
    new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text),
    (part) => part.segment,
  );
}

/** Short comments come back whole; long ones become a preview, never cut mid-character. */
export function reviewComment(comment: string): { text: string; preview: string | null } {
  const parts = graphemes(comment);
  if (parts.length <= REVIEW_COMMENT_LIMIT) return { text: comment, preview: null };
  const head = parts.slice(0, PREVIEW_LENGTH).join("");
  const cut = head.lastIndexOf(" ");
  return {
    text: comment,
    preview: `${(cut > PREVIEW_MIN_CUT ? head.slice(0, cut) : head).trimEnd()}…`,
  };
}
