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

const VALID_OFFER_STATUSES = new Set<OfferStatus>([
  "Pending",
  "Accepted",
  "Rejected",
  "Withdrawn",
]);

function isPositiveInt32(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0 &&
    value <= 2_147_483_647
  );
}

function isValidOfferStatus(value: unknown): value is OfferStatus {
  return typeof value === "string" && VALID_OFFER_STATUSES.has(value as OfferStatus);
}

function isOptionalString(value: unknown): boolean {
  return value === null || value === undefined || typeof value === "string";
}

function isValidRatingRecord(value: unknown): value is MarketerRating {
  if (typeof value !== "object" || value === null) return false;
  const rating = value as Partial<MarketerRating>;
  const validAvg = rating.average_rating === null || typeof rating.average_rating === "number";
  return (
    typeof rating.is_rated === "boolean" &&
    validAvg &&
    typeof rating.review_count === "number" &&
    typeof rating.completed_jobs === "number"
  );
}

function isValidMarketerRecord(value: unknown): value is MarketerProfile {
  if (typeof value !== "object" || value === null) return false;
  const marketer = value as Partial<MarketerProfile>;
  return typeof marketer.name === "string";
}

function isJobOfferRecord(value: unknown, expectedJobId: number): value is JobOfferComparison {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Partial<JobOfferComparison>;

  if (
    !isPositiveInt32(item.offer_id) ||
    item.job_id !== expectedJobId ||
    !isPositiveInt32(item.marketer_id)
  ) {
    return false;
  }

  if (typeof item.offered_price !== "string" || !isValidOfferStatus(item.offer_status)) {
    return false;
  }

  if (
    typeof item.created_at !== "string" ||
    !isOptionalString(item.delivery_date) ||
    !isOptionalString(item.message)
  ) {
    return false;
  }

  return isValidMarketerRecord(item.marketer) && isValidRatingRecord(item.rating);
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
