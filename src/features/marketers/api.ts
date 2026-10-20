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

export async function getPublicCatalog(id: number): Promise<PublicCatalog> {
  if (!isPositiveId(id)) throw new ApiError(404, "marketer_not_found", "Marketer not found.");
  const detail = await serverApiGet<{
    profile: { user_id: number; name: string };
    services: unknown;
  }>(`/api/v1/marketers/${id}`);
  if (detail.profile.user_id !== id)
    throw new ApiError(502, "invalid_response", "Marketer could not be loaded.");
  return { marketer: detail.profile, services: readServices(detail.services) };
}
