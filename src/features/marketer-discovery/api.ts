import { serverApiGet } from "@/lib/api/server-client";
import {
  toBackendSearchParams,
  toMarketer,
  toMarketerSummary,
} from "@/features/marketer-discovery/mapping";
import { ApiError } from "@/lib/api/errors";
import type { components } from "@/lib/api/generated/backend";
import type {
  Marketer,
  MarketerQuery,
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
