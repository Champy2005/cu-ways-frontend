"use server";

import { revalidatePath } from "next/cache";
import { loadJobOffersInitialData } from "@/features/jobs/api";
import type { CreatorJobSummary, JobOfferComparison } from "@/features/jobs/types";
import { ApiError } from "@/lib/api/errors";
import { serverApiRequest } from "@/lib/api/server-client";
import { getSession } from "@/lib/auth/session";

export type JobOffersSnapshot = { job: CreatorJobSummary; offers: JobOfferComparison[] };
export type RefreshOffersResult =
  { status: "ready"; data: JobOffersSnapshot } | { status: "error"; message: string };
export type AcceptOfferResult =
  | { status: "accepted"; data: JobOffersSnapshot }
  | { status: "conflict"; data: JobOffersSnapshot; message: string }
  | { status: "error" | "uncertain"; message: string };

function validId(value: unknown): value is number {
  return (
    typeof value === "number" && Number.isSafeInteger(value) && value > 0 && value <= 2_147_483_647
  );
}

function accessMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  if (error.status === 401) return "Your session expired. Sign in again to continue.";
  if (error.status === 403 || (error.status === 404 && error.code === "job_not_found")) {
    return "You no longer have access to this job. Return to your jobs to continue.";
  }
  return null;
}

async function readSnapshot(jobId: number): Promise<JobOffersSnapshot> {
  const data = await loadJobOffersInitialData(jobId);
  if (data.offers.status !== "success") throw new Error("Offers could not be refreshed.");
  return { job: data.job, offers: data.offers.items };
}

export async function refreshJobOffers(jobId: unknown): Promise<RefreshOffersResult> {
  if (!validId(jobId)) return { status: "error", message: "This job is not available." };
  try {
    if (!(await getSession())) {
      return { status: "error", message: "Your session expired. Sign in again to continue." };
    }
    return { status: "ready", data: await readSnapshot(jobId) };
  } catch (error) {
    return {
      status: "error",
      message: accessMessage(error) ?? "Offers could not be refreshed. Please try again.",
    };
  }
}

async function reconcileAcceptance(
  jobId: number,
  offerId: number,
  conflict: boolean,
): Promise<AcceptOfferResult> {
  try {
    const data = await readSnapshot(jobId);
    const selected = data.offers.find((offer) => offer.offer_id === offerId);
    if (data.job.job_status !== "Pending" && selected?.offer_status === "Accepted") {
      revalidatePath(`/creator/jobs/${jobId}/offers`);
      revalidatePath(`/creator/jobs/${jobId}/invite`);
      revalidatePath("/creator/jobs/offers");
      return { status: "accepted", data };
    }
    if (conflict) {
      return {
        status: "conflict",
        data,
        message:
          "This offer or job has changed. The latest offers are shown below. Review them before choosing again.",
      };
    }
  } catch (error) {
    const message = accessMessage(error);
    if (message) return { status: "error", message };
  }
  return {
    status: "uncertain",
    message:
      "Your request was submitted, but the final status could not be confirmed. Refresh offers before making another decision.",
  };
}

export async function acceptJobOffer(jobId: unknown, offerId: unknown): Promise<AcceptOfferResult> {
  if (!validId(jobId) || !validId(offerId)) {
    return { status: "error", message: "Choose a valid offer from this job." };
  }
  try {
    if (!(await getSession()))
      return { status: "error", message: "Your session expired. Sign in again to continue." };
    await serverApiRequest(`/api/v1/jobs/${jobId}/offers/${offerId}/accept`, { method: "POST" });
  } catch (error) {
    const message = accessMessage(error);
    if (message) return { status: "error", message };
    if (error instanceof ApiError && (error.status === 409 || error.code === "offer_not_found")) {
      return reconcileAcceptance(jobId, offerId, true);
    }
    // A lost response may hide a committed transaction. Never blindly retry the POST.
    return {
      status: "uncertain",
      message:
        "The result of your request is unknown. Refresh offers to check whether a marketer was hired before trying again.",
    };
  }
  return reconcileAcceptance(jobId, offerId, false);
}
