import { serverApiGet } from "@/lib/api/server-client";
import {
  toBackendSearchParams,
  toMarketer,
  toMarketerReview,
  toMarketerSummary,
} from "@/features/marketer-discovery/mapping";
import { ApiError } from "@/lib/api/errors";
import type { components } from "@/lib/api/generated/backend";
import type {
  Marketer,
  MarketerQuery,
  MarketerReviewHistory,
  MarketerReviewsPage,
  MarketerSearchPage,
  MarketerSearchResult,
} from "@/features/marketer-discovery/types";

// Backed by GET /api/v1/marketers on cu-ways-backend dev. Server-only, matching
// features/users/api.ts: serverApiGet attaches the session's bearer token, so
// Client Components must not import this module.

const SEARCH_PATH = "/api/v1/marketers";

export async function listMarketers(
  query: MarketerQuery,
  pageNumber: number = 1,
): Promise<MarketerSearchResult> {
  const page = await serverApiGet<MarketerSearchPage>(
    `${SEARCH_PATH}?${toBackendSearchParams(query, undefined, pageNumber).toString()}`,
  );
  return { items: page.items.map(toMarketerSummary), total: page.total };
}

export async function getMarketer(marketerID: number): Promise<Marketer | null> {
  try {
    const detail = await serverApiGet<components["schemas"]["MarketerDetailResponse"]["data"]>(
      `${SEARCH_PATH}/${marketerID}`,
    );
    const marketer = toMarketer({
      ...detail,
      lowest_matching_service_price: null,
      review_count: detail.review_count,
    });
    return {
      ...marketer,
      performance: { ...marketer.performance, completed_jobs: detail.total_completed_jobs },
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** The backend's largest review page; the cap keeps one profile view bounded. */
const REVIEWS_PAGE_SIZE = 50;
const MAX_REVIEW_PAGES = 20;

/**
 * Backed by GET /api/v1/marketers/{id}/reviews. The backend can only page and
 * has no rating filter or per-star counts, so the profile reads the whole
 * history (newest first) and filters, counts and pages it itself. A rejected
 * page rejects the whole read, so a partial history is never shown as complete.
 */
export async function getMarketerReviews(marketerID: number): Promise<MarketerReviewHistory> {
  const read = (page: number) =>
    serverApiGet<MarketerReviewsPage>(
      `${SEARCH_PATH}/${marketerID}/reviews?page=${page}&page_size=${REVIEWS_PAGE_SIZE}`,
    );

  const first = await read(1);
  const pages = Math.min(Math.ceil(first.total / REVIEWS_PAGE_SIZE), MAX_REVIEW_PAGES);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, i) => read(i + 2)),
  );

  const seen = new Set<number>();
  const reviews = [first, ...rest]
    .flatMap((page) => page.items)
    .filter((item) => !seen.has(item.review_id) && seen.add(item.review_id))
    .map(toMarketerReview);

  return {
    reviews,
    average_rating: first.average_rating,
    review_count: first.review_count,
    truncated: first.total > MAX_REVIEW_PAGES * REVIEWS_PAGE_SIZE,
  };
}
