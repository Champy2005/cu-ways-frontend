import { serverApiGet } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { isPositiveId, readMarketerProfile, readServices } from "./contracts";
import type { MarketerStats, PublicCatalog } from "./types";

export async function getMyProfile() {
  return readMarketerProfile(await serverApiGet<unknown>("/api/v1/me/marketer-profile"));
}
export async function getMyServices() {
  return readServices(await serverApiGet<unknown>("/api/v1/me/services"));
}
// No dedicated contracts exist yet. Never call speculative URLs or supply fixtures in live mode.
export async function getMyStats(): Promise<MarketerStats> {
  throw new ApiError(503, "feature_unavailable", "Performance summaries are not available yet.");
}
export async function getPublicCatalog(id: number): Promise<PublicCatalog> {
  if (!isPositiveId(id)) throw new ApiError(404, "marketer_not_found", "Marketer not found.");
  throw new ApiError(503, "feature_unavailable", "Public service catalogs are not available yet.");
}
