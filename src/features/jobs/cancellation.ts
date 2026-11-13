import type { CreatorJobSummary } from "./types";

export type CancellationDetails = {
  jobId: number;
  title: string;
  status: CreatorJobSummary["job_status"];
  paid: boolean;
  activeRequests: number;
  pendingOffers: number;
  cancelledAt: string | null;
  reason: string | null;
};

export type CancellationRead =
  | { status: "ready"; details: CancellationDetails }
  | { status: "error" | "unavailable"; message: string };

export type CancellationResult =
  | { status: "cancelled"; details: CancellationDetails }
  | { status: "rejected" | "unknown" | "unavailable"; message: string };

/** Reflect the existing cancellation endpoint's eligibility, including its status limit. */
export function cancellationBlockedReason(details: CancellationDetails): string | null {
  if (details.status === "Cancelled")
    return "This job has already been cancelled. Its history is retained.";
  if (details.status === "Completed")
    return "Completed jobs cannot be cancelled. Their payment and review history is preserved.";
  if (details.paid) return "Payment is Paid. This job can no longer be cancelled.";
  return null;
}

/** Store only uncertainty, never contract data or authorization, across a document return. */
export function cancellationCheckKey(creatorId: number, jobId: string) {
  return `cuways:creator:${creatorId}:job:${jobId}:cancel-check`;
}
