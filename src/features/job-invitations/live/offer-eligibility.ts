import { bangkokDate } from "../format";
import type { MarketerOfferItem, ReceivedRequest, SavedOffer } from "./types";

export function canResubmitOffer(
  offer: SavedOffer | null,
  request: ReceivedRequest,
  today = bangkokDate(),
): boolean {
  return (
    offer?.offer_status === "Withdrawn" &&
    request.request_status === "Accepted" &&
    request.job.job_status === "Pending" &&
    (!request.job.deadline || bangkokDate(request.job.deadline) >= today)
  );
}

export function currentOfferIds(items: MarketerOfferItem[]): Set<number> {
  const latest = new Map<number, SavedOffer>();
  for (const { request, offer } of items) {
    const previous = latest.get(request.job_request_id);
    if (
      !previous ||
      Date.parse(offer.created_at) > Date.parse(previous.created_at) ||
      (Date.parse(offer.created_at) === Date.parse(previous.created_at) &&
        offer.offer_id > previous.offer_id)
    ) {
      latest.set(request.job_request_id, offer);
    }
  }
  return new Set([...latest.values()].map((offer) => offer.offer_id));
}
