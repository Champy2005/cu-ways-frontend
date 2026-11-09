"use server";

import { ApiError } from "@/lib/api/errors";
import { serverApiRequest } from "@/lib/api/server-client";
import { getSession } from "@/lib/auth/session";
import { parseProjectBriefUrl } from "@/features/jobs/project-brief";
import { getPayment, getProofs, getReview, jobPath } from "./queries";
import type { JobMutation, MutationResult } from "./types";

async function alreadySaved(id: string, mutation: JobMutation) {
  switch (mutation.kind) {
    case "payment":
      return (await getPayment(id)).payment !== null;
    case "complete":
      return (await getPayment(id)).job_status === "Completed";
    case "start": {
      const status = (await getPayment(id)).job_status;
      return status === "In Progress" || status === "Completed";
    }
    case "proof":
      return (await getProofs(id)).some((proof) => proof.url === mutation.url);
    case "review":
      return (await getReview(id)).review !== null;
  }
}

function mutationRequest(id: string, mutation: JobMutation) {
  const path = jobPath(id);
  switch (mutation.kind) {
    case "start":
    case "complete":
      return { url: `${path}/${mutation.kind}` };
    case "proof": {
      const url = typeof mutation.url === "string" && parseProjectBriefUrl(mutation.url);
      if (!url)
        throw new ApiError(422, "invalid_proof", "Enter an absolute HTTP or HTTPS proof link.");
      return { url: `${path}/proofs`, body: { url } };
    }
    case "payment":
      return { url: `${path}/payments`, body: mutation.input };
    case "review":
      return {
        url: `${path}/reviews`,
        body: { rating: mutation.rating, comment: mutation.comment },
      };
    default:
      throw new ApiError(422, "invalid_action", "Select a valid job action.");
  }
}

export async function saveJobMutation(id: string, mutation: JobMutation): Promise<MutationResult> {
  if (!(await getSession()))
    return { status: "error", message: "Your session expired. Sign in again to continue." };
  try {
    const { url, body } = mutationRequest(id, mutation);
    await serverApiRequest(url, {
      method: "POST",
      headers: body && { "Content-Type": "application/json" },
      body: body && JSON.stringify(body),
    });
    return { status: "saved" };
  } catch (error) {
    const ambiguous =
      !(error instanceof ApiError) ||
      error.status >= 500 ||
      error.status === 409 ||
      error.status === 200 ||
      error.status === 201;
    if (ambiguous) {
      try {
        if (await alreadySaved(id, mutation)) return { status: "saved" };
      } catch {
        return {
          status: "reconcile",
          message:
            "The result could not be confirmed. Reload the page to check the saved record before trying again.",
        };
      }
    }
    return {
      status: "error",
      message:
        error instanceof ApiError && error.status < 500
          ? error.message
          : "The change was not saved. Try again.",
    };
  }
}
