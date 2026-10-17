import type { components } from "@/lib/api/generated/backend";

export type CreatorJobSummary = components["schemas"]["CreatorJobSummary"];
export type JobRequestRecord = components["schemas"]["JobRequest"];
export type SentJobInvitation = components["schemas"]["SentJobRequest"];

export type JobSurveyOption = {
  id: string;
  title: string;
  targetResponses: number | null;
};

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
