import { findMockMarketer, selectMockMarketers } from "@/features/marketer-discovery/mock-data";
import type {
  Marketer,
  MarketerQuery,
  MarketerSearchResult,
} from "@/features/marketer-discovery/types";

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRATION POINT — owned by the marketer search/filter backend task.
//
// The backend OpenAPI contract has no marketer endpoints yet, so these two
// functions resolve from src/features/marketers/mock-data.ts. This file is the
// ONLY seam: no page or component reaches past it. When the contract lands:
//
//   1. pnpm generate:api
//   2. replace the two bodies below with serverApiGet<T> calls, e.g.
//        return serverApiGet<MarketerSearchResult>(`/api/v1/marketers?${qs}`);
//   3. delete src/features/marketers/mock-data.ts
//   4. rewrite src/features/marketers/types.ts as components["schemas"][...] aliases
//
// Both are already async so every call site awaits them today and the swap
// changes no caller. Server-only by convention, matching features/users/api.ts —
// Client Components must not import this module.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `query` is accepted in full so the signature is already correct for the real
 * endpoint. The mock honours the keyword and orders by rating so the sort
 * control is demonstrable; the remaining filters are the backend's
 * responsibility and must not be reimplemented in the frontend.
 */
export async function listMarketers(query: MarketerQuery): Promise<MarketerSearchResult> {
  return selectMockMarketers(query);
}

export async function getMarketer(marketerID: number): Promise<Marketer | null> {
  return findMockMarketer(marketerID);
}
