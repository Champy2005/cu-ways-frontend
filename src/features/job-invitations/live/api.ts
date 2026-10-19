import { serverApiGet } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { readOffers, readRequests } from "./contracts";
import type { InvitationEntry, MarketerOffersSnapshot, ReceivedRequest, SavedOffer } from "./types";

async function loadHistory(request: ReceivedRequest): Promise<{
  request: ReceivedRequest;
  offers: SavedOffer[];
  offersUnavailable: boolean;
}> {
  if (!["Accepted", "Closed"].includes(request.request_status))
    return { request, offers: [], offersUnavailable: false };
  try {
    const offers = readOffers(
      await serverApiGet<unknown>(`/api/v1/me/job-requests/${request.job_request_id}/offers`),
      request,
    );
    return { request, offers, offersUnavailable: false };
  } catch (error) {
    if (error instanceof ApiError && [401, 403, 404].includes(error.status)) throw error;
    return { request, offers: [], offersUnavailable: true };
  }
}

export async function getInvitations(requestId?: string): Promise<InvitationEntry[]> {
  const requests = readRequests(await serverApiGet<unknown>("/api/v1/me/job-requests"));
  const selected = requestId
    ? requests.filter((item) => String(item.job_request_id) === requestId)
    : requests;
  if (requestId && selected.length === 0)
    throw new ApiError(404, "job_request_not_found", "This invitation could not be found.");
  const histories = await Promise.all(selected.map(loadHistory));
  return histories.map(({ request, offers, offersUnavailable }) => ({
    request,
    offer: offers[0] ?? null,
    offersUnavailable,
  }));
}

export async function getMarketerOffers(): Promise<MarketerOffersSnapshot> {
  const requests = readRequests(await serverApiGet<unknown>("/api/v1/me/job-requests"));
  const histories = await Promise.all(requests.map(loadHistory));
  const offers = histories.flatMap(({ request, offers }) =>
    offers.map((offer) => ({ request, offer })),
  );
  offers.sort(
    (a, b) =>
      Date.parse(b.offer.created_at) - Date.parse(a.offer.created_at) ||
      b.offer.offer_id - a.offer.offer_id,
  );
  return { offers, offersUnavailable: histories.some((entry) => entry.offersUnavailable) };
}
