"use server";

import { revalidatePath } from "next/cache";
import { getCreatorJob, getCurrentJobPayment, getJobOffers, getJobSentInvitations } from "./api";
import { isActiveJobInvitation } from "./types";
import { jobPath } from "@/features/transactions/queries";
import {
  cancellationBlockedReason,
  type CancellationDetails,
  type CancellationRead,
  type CancellationResult,
} from "./cancellation";
import { ApiError } from "@/lib/api/errors";
import type { components } from "@/lib/api/generated/backend";
import { serverApiRequest } from "@/lib/api/server-client";
import { getSession } from "@/lib/auth/session";

function parseJobId(value: string): number {
  try {
    jobPath(value);
  } catch {
    throw new ApiError(404, "job_not_found", "Job unavailable.");
  }
  return Number(value);
}

async function requireCreatorSession(creatorId: number) {
  const session = await getSession();
  if (!session || session.userId !== creatorId)
    throw new ApiError(401, "unauthorized", "Sign in again to continue.");
}

function accessFailure(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  if (error.status === 401) return "Your session expired. Sign in again to continue.";
  if (error.status === 403 || error.status === 404)
    return "This job is unavailable or you no longer have permission to manage it.";
  return null;
}

async function readCancellationDetails(jobId: number): Promise<CancellationDetails> {
  const options = { signal: AbortSignal.timeout(10_000) };
  // This read authorizes the owning Creator before any contract history is loaded.
  const job = await getCreatorJob(jobId, options);
  if (
    job.job_id !== jobId ||
    !["Pending", "Accepted", "In Progress", "Completed", "Cancelled"].includes(job.job_status) ||
    (job.title != null && typeof job.title !== "string") ||
    (job.cancelled_at != null &&
      (typeof job.cancelled_at !== "string" || !Number.isFinite(Date.parse(job.cancelled_at)))) ||
    (job.cancel_reason != null && typeof job.cancel_reason !== "string")
  )
    throw new Error("Invalid job response.");
  const [payment, requests, offers] = await Promise.all([
    getCurrentJobPayment(jobId, options),
    getJobSentInvitations(jobId, options),
    getJobOffers(jobId, undefined, options),
  ]);
  return {
    jobId,
    title: job.title || `Job #${jobId}`,
    status: job.job_status,
    paid: payment?.payment_status === "Paid",
    activeRequests: requests.filter(isActiveJobInvitation).length,
    pendingOffers: offers.filter((offer) => offer.offer_status === "Pending").length,
    cancelledAt: job.cancelled_at ?? null,
    reason: job.cancel_reason ?? null,
  };
}

export async function loadCancellationDetails(
  jobIdValue: string,
  creatorId: number,
): Promise<CancellationRead> {
  try {
    await requireCreatorSession(creatorId);
    return { status: "ready", details: await readCancellationDetails(parseJobId(jobIdValue)) };
  } catch (error) {
    const message = accessFailure(error);
    return message
      ? { status: "unavailable", message }
      : {
          status: "error",
          message: "Cancellation details could not be verified. Refresh before trying again.",
        };
  }
}

export async function cancelCreatorJob(
  jobIdValue: string,
  creatorId: number,
): Promise<CancellationResult> {
  let details: CancellationDetails;
  let jobId: number;
  try {
    await requireCreatorSession(creatorId);
    jobId = parseJobId(jobIdValue);
    details = await readCancellationDetails(jobId);
    if (details.status === "Cancelled") return { status: "cancelled", details };
    const reason = cancellationBlockedReason(details);
    if (reason) return { status: "rejected", message: reason };
  } catch (error) {
    const message = accessFailure(error);
    return message
      ? { status: "unavailable", message }
      : {
          status: "rejected",
          message: "Cancellation details could not be verified. Refresh before trying again.",
        };
  }

  let saved: components["schemas"]["CancelJobResponse"]["data"];
  try {
    saved = await serverApiRequest(`/api/v1/jobs/${jobId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(10_000),
    });
    const validIds = (value: unknown) =>
      Array.isArray(value) &&
      value.every((id) => Number.isSafeInteger(id) && id > 0) &&
      new Set(value).size === value.length;
    if (
      !saved ||
      saved.job_id !== jobId ||
      saved.job_status !== "Cancelled" ||
      typeof saved.cancelled_at !== "string" ||
      !Number.isFinite(Date.parse(saved.cancelled_at)) ||
      !(saved.cancel_reason === null || typeof saved.cancel_reason === "string") ||
      !validIds(saved.closed_job_request_ids) ||
      !validIds(saved.rejected_offer_ids)
    )
      throw new Error("Cancellation response was not confirmed.");
  } catch (error) {
    const message = accessFailure(error);
    if (message) return { status: "unavailable", message };
    if (error instanceof ApiError && [409, 422].includes(error.status))
      return {
        status: "rejected",
        message: "The job could not be cancelled. Refresh to check its current status and payment.",
      };
    return {
      status: "unknown",
      message: "The cancellation result is unknown. Check the current job before trying again.",
    };
  }

  // The confirmed transaction closes active requests and rejects Pending offers atomically.
  try {
    revalidatePath("/creator/jobs", "layout");
  } catch {
    /* A refresh failure cannot undo a committed cancellation. */
  }
  return {
    status: "cancelled",
    details: {
      ...details,
      status: "Cancelled",
      cancelledAt: saved.cancelled_at,
      reason: saved.cancel_reason,
      activeRequests: 0,
      pendingOffers: 0,
    },
  };
}
