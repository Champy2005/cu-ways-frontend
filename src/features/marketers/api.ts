import { serverApiGet } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { isPositiveId, readMarketerProfile, readMarketerStats, readServices } from "./contracts";
import type { MarketerStats, PublicCatalog } from "./types";

export async function getMyProfile() {
  return readMarketerProfile(await serverApiGet<unknown>("/api/v1/me/marketer-profile"));
}
export async function getMyServices() {
  return readServices(await serverApiGet<unknown>("/api/v1/me/services"));
}
export async function getMyStats(): Promise<MarketerStats> {
  return readMarketerStats(await serverApiGet<unknown>("/api/v1/me/statistics"));
}

// No public marketer-by-ID catalog contract exists yet. Never approximate it from search results.
export async function getPublicCatalog(id: number): Promise<PublicCatalog> {
  if (!isPositiveId(id)) throw new ApiError(404, "marketer_not_found", "Marketer not found.");
  throw new ApiError(503, "feature_unavailable", "Public service catalogs are not available yet.");
}
