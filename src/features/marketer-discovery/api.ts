import { serverApiGet } from "@/lib/api/server-client";
import {
  toBackendSearchParams,
  toMarketer,
  toMarketerSummary,
} from "@/features/marketer-discovery/mapping";
import { EMPTY_MARKETER_QUERY } from "@/features/marketer-discovery/schemas";
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

export async function listMarketers(query: MarketerQuery): Promise<MarketerSearchResult> {
  const page = await serverApiGet<MarketerSearchPage>(
    `${SEARCH_PATH}?${toBackendSearchParams(query).toString()}`,
  );
  return { items: page.items.map(toMarketerSummary), total: page.total };
}

/**
 * The backend has no GET /api/v1/marketers/{id} yet, so this searches with no
 * filters at the maximum page size and picks the id. Correct while there are
 * at most 100 marketers; switch to the direct endpoint once it exists.
 */
export async function getMarketer(marketerID: number): Promise<Marketer | null> {
  const page = await serverApiGet<MarketerSearchPage>(
    `${SEARCH_PATH}?${toBackendSearchParams(EMPTY_MARKETER_QUERY).toString()}`,
  );
  const item = page.items.find((candidate) => candidate.profile.user_id === marketerID);
  return item ? toMarketer(item) : null;
}
