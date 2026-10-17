import type { components } from "@/lib/api/generated/backend";

export type CreatorJobSummary = components["schemas"]["CreatorJobSummary"];
export type JobRequestRecord = components["schemas"]["JobRequest"];
export type SentJobInvitation = components["schemas"]["SentJobRequest"];
export type JobOfferComparison = components["schemas"]["JobOfferComparison"];
export type MarketerRating = components["schemas"]["MarketerRating"];
export type MarketerProfile = components["schemas"]["MarketerProfile"];
export type Offer = components["schemas"]["Offer"];
export type OfferStatus = components["schemas"]["Offer"]["offer_status"];

export type JobInviteMarketer = {
  marketer_id: number;
  display_name: string;
  headline: string;
  average_rating: number | null;
  rating_count: number;
};

export function isActiveJobInvitation(
  invitation: Pick<SentJobInvitation, "request_status">,
): boolean {
  return invitation.request_status === "Pending" || invitation.request_status === "Accepted";
}

function isSentJobInvitationRecord(
  value: unknown,
  expectedJobId: number,
): value is SentJobInvitation {
  if (typeof value !== "object" || value === null) return false;
  const invitation = value as Partial<SentJobInvitation>;
  return (
    Number.isSafeInteger(invitation.job_request_id) &&
    invitation.job_request_id! > 0 &&
    invitation.job_request_id! <= 2_147_483_647 &&
    invitation.job_id === expectedJobId &&
    Number.isSafeInteger(invitation.marketer_id) &&
    invitation.marketer_id! > 0 &&
    invitation.marketer_id! <= 2_147_483_647 &&
    (invitation.request_status === "Pending" ||
      invitation.request_status === "Accepted" ||
      invitation.request_status === "Declined" ||
      invitation.request_status === "Closed") &&
    typeof invitation.created_at === "string" &&
    (invitation.responded_at === null || typeof invitation.responded_at === "string") &&
    typeof invitation.marketer_name === "string"
  );
}

export function validateSentJobInvitations(
  value: unknown,
  expectedJobId: number,
): SentJobInvitation[] {
  if (!Array.isArray(value)) {
    throw new Error("The invitation history response was invalid.");
  }

  const requestIds = new Set<number>();
  for (const invitation of value) {
    if (
      !isSentJobInvitationRecord(invitation, expectedJobId) ||
      requestIds.has(invitation.job_request_id)
    ) {
      throw new Error("The invitation history response was invalid.");
    }
    requestIds.add(invitation.job_request_id);
  }

  return value as SentJobInvitation[];
}

function isJobOfferRecord(value: unknown, expectedJobId: number): value is JobOfferComparison {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Partial<JobOfferComparison>;
  return (
    Number.isSafeInteger(item.offer_id) &&
    item.offer_id! > 0 &&
    item.offer_id! <= 2_147_483_647 &&
    item.job_id === expectedJobId &&
    Number.isSafeInteger(item.marketer_id) &&
    item.marketer_id! > 0 &&
    item.marketer_id! <= 2_147_483_647 &&
    typeof item.offered_price === "string" &&
    (item.offer_status === "Pending" ||
      item.offer_status === "Accepted" ||
      item.offer_status === "Rejected" ||
      item.offer_status === "Withdrawn") &&
    typeof item.created_at === "string" &&
    (item.delivery_date === null ||
      item.delivery_date === undefined ||
      typeof item.delivery_date === "string") &&
    (item.message === null || item.message === undefined || typeof item.message === "string") &&
    typeof item.marketer === "object" &&
    item.marketer !== null &&
    typeof item.marketer.name === "string" &&
    typeof item.rating === "object" &&
    item.rating !== null &&
    typeof item.rating.is_rated === "boolean" &&
    (item.rating.average_rating === null || typeof item.rating.average_rating === "number") &&
    typeof item.rating.review_count === "number" &&
    typeof item.rating.completed_jobs === "number"
  );
}

export function validateJobOffers(value: unknown, expectedJobId: number): JobOfferComparison[] {
  if (!Array.isArray(value)) {
    throw new Error("The offers comparison response was invalid.");
  }

  const offerIds = new Set<number>();
  for (const offer of value) {
    if (!isJobOfferRecord(offer, expectedJobId) || offerIds.has(offer.offer_id)) {
      throw new Error("The offers comparison response was invalid.");
    }
    offerIds.add(offer.offer_id);
  }

  return value as JobOfferComparison[];
}
