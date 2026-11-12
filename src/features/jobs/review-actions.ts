"use server";

import { revalidatePath } from "next/cache";
import { getCurrentJobReview } from "@/features/jobs/api";
import {
  SESSION_EXPIRED,
  accessErrorMessage,
  checkJobRecord,
  saveJobRecord,
  validJobId,
} from "@/features/jobs/job-record-save";
import {
  RATING_REQUIRED,
  isSavedReview,
  isStarRating,
  normalizeComment,
  type SavedReview,
} from "@/features/jobs/review";
import type { ApiError } from "@/lib/api/errors";
import { getSession } from "@/lib/auth/session";

export type SubmitReviewResult =
  | { status: "submitted"; review: SavedReview }
  /** The job was already reviewed; this is the saved review read back from the backend. */
  | { status: "existing"; review: SavedReview; message: string }
  /** The backend refused a duplicate, but the saved review could not be read. */
  | { status: "existing_unconfirmed"; message: string }
  /** The job is no longer Completed, so it cannot be reviewed. */
  | { status: "unavailable"; message: string }
  /** The backend refused the request, so nothing was saved. Retrying is safe. */
  | { status: "error"; message: string }
  /** The request failed or timed out and no saved review was found yet, so the outcome is unknown. */
  | { status: "unknown"; message: string };

export type CheckReviewResult =
  | { status: "found"; review: SavedReview }
  | { status: "none" }
  | { status: "error"; message: string };

function revalidateReviewPaths(jobId: number) {
  revalidatePath(`/creator/jobs/${jobId}`);
  revalidatePath(`/creator/jobs/${jobId}/review`);
}

function mapReviewError(error: ApiError): SubmitReviewResult {
  if (error.code === "job_not_completed") {
    return {
      status: "unavailable",
      message: "This job is no longer completed, so it cannot be reviewed. Return to the job.",
    };
  }
  if (error.code === "validation_error") {
    return { status: "error", message: `${RATING_REQUIRED} Then try again.` };
  }
  return {
    status: "error",
    message: accessErrorMessage(error) ?? "The review could not be submitted. Please try again.",
  };
}

export async function submitJobReview(
  jobId: unknown,
  rating: unknown,
  comment: unknown,
): Promise<SubmitReviewResult> {
  if (!validJobId(jobId)) return { status: "error", message: "This job is not available." };
  if (!isStarRating(rating)) return { status: "error", message: RATING_REQUIRED };
  if (comment !== null && typeof comment !== "string") {
    return { status: "error", message: "Check the comment, then try again." };
  }
  if (!(await getSession())) return { status: "error", message: SESSION_EXPIRED };

  const result = await saveJobRecord({
    path: `/api/v1/jobs/${jobId}/reviews`,
    body: { rating, comment: comment === null ? null : normalizeComment(comment) },
    isSaved: (value): value is SavedReview => isSavedReview(value, jobId),
    readCurrent: () => getCurrentJobReview(jobId),
    duplicateCode: "review_already_exists",
  });
  switch (result.status) {
    case "saved":
      revalidateReviewPaths(jobId);
      return { status: "submitted", review: result.record };
    case "existing":
      revalidateReviewPaths(jobId);
      return {
        status: "existing",
        review: result.record,
        message: result.afterUnclearRequest
          ? "This review is saved for this job."
          : "This job already has a review, so a new one was not submitted.",
      };
    case "existing_unconfirmed":
      return {
        status: "existing_unconfirmed",
        message:
          "This job already has a review, but it could not be loaded. Check the review status to see it.",
      };
    case "unknown":
      return {
        status: "unknown",
        message:
          "We could not confirm whether the review was saved. Check the review status before trying again.",
      };
    case "rejected":
      return mapReviewError(result.error);
  }
}

/** Reads the job's review again, for when an earlier request had an unknown result. */
export async function checkJobReview(jobId: unknown): Promise<CheckReviewResult> {
  if (!validJobId(jobId)) return { status: "error", message: "This job is not available." };
  if (!(await getSession())) return { status: "error", message: SESSION_EXPIRED };
  const result = await checkJobRecord(
    () => getCurrentJobReview(jobId),
    "The review status could not be checked. Check your connection and try again.",
  );
  if (result.status !== "found") return result;
  revalidateReviewPaths(jobId);
  return { status: "found", review: result.record };
}
