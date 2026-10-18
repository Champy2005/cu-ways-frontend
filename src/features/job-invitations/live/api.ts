import { serverApiGet } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { readOffers, readRequests } from "./contracts";
import type { InvitationEntry, ReceivedRequest } from "./types";

async function loadEntry(request: ReceivedRequest): Promise<InvitationEntry> {
  if (!["Accepted", "Closed"].includes(request.request_status))
    return { request, offer: null, offersUnavailable: false };
  try {
    const offers = readOffers(
      await serverApiGet<unknown>(`/api/v1/me/job-requests/${request.job_request_id}/offers`),
      request,
    );
    return { request, offer: offers[0] ?? null, offersUnavailable: false };
  } catch (error) {
    if (error instanceof ApiError && [401, 403, 404].includes(error.status)) throw error;
    return { request, offer: null, offersUnavailable: true };
  }
}

export async function getInvitations(requestId?: string): Promise<InvitationEntry[]> {
  const requests = readRequests(await serverApiGet<unknown>("/api/v1/me/job-requests"));
  const selected = requestId
    ? requests.filter((item) => String(item.job_request_id) === requestId)
    : requests;
  if (requestId && selected.length === 0)
    throw new ApiError(404, "job_request_not_found", "This invitation could not be found.");
  return Promise.all(selected.map(loadEntry));
}

export async function getMarketerOffers(): Promise<{
  offers: Array<{ offer: InvitationEntry["offer"]; request: ReceivedRequest }>;
  offersUnavailable: boolean;
}> {
  const entries = await getInvitations();
  const hasUnavailable = entries.some((entry) => entry.offersUnavailable);
  const items = entries
    .filter((entry) => entry.offer !== null)
    .map((entry) => ({
      offer: entry.offer,
      request: entry.request,
    }));
  return { offers: items, offersUnavailable: hasUnavailable };
}
