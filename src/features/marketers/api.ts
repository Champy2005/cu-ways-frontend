import { serverApiGet } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import {
  isPositiveId,
  readMarketerProfile,
  readMarketerStats,
  readPublicCatalog,
  readServices,
} from "@/features/marketers/contracts";

/** Proposed endpoints pending Rew/Gy's backend OpenAPI implementation. */
export async function getMyProfile() {
  return readMarketerProfile(await serverApiGet<unknown>("/api/v1/marketers/me"));
}

export async function getMyServices() {
  return readServices(await serverApiGet<unknown>("/api/v1/marketers/me/services"));
}

export async function getMyStats() {
  return readMarketerStats(await serverApiGet<unknown>("/api/v1/marketers/me/stats"));
}

export async function getPublicCatalog(id: number) {
  if (!isPositiveId(id)) throw new ApiError(404, "marketer_not_found", "Marketer not found.");
  const catalog = readPublicCatalog(
    await serverApiGet<unknown>(`/api/v1/marketers/${id}/services`),
  );
  if (catalog.marketer.user_id !== id) {
    throw new ApiError(
      502,
      "invalid_backend_response",
      "The service catalog is temporarily unavailable.",
    );
  }
  return catalog;
}
