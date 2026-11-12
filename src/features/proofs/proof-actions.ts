/**
 * Server-side proof save and list check, used by the proof API route
 * (proof-route.ts). They are plain server functions, not server actions: Next.js
 * runs server actions one at a time, so a stalled save would hold the "Check
 * saved proof" refresh behind it. The page reaches these with an abortable
 * fetch instead, which never queues behind another request.
 */

import { revalidatePath } from "next/cache";
import { parseProjectBriefUrl } from "@/features/jobs/project-brief";
import { ApiError } from "@/lib/api/errors";
import { serverApiGet, serverApiRequest } from "@/lib/api/server-client";
import { getSession } from "@/lib/auth/session";
import type { Proof } from "@/features/transactions/types";
import { PROOF_READ_TIMEOUT_MS, PROOF_REQUEST_TIMEOUT_MS } from "./proof-limits";

export type SaveProofResult =
  | { status: "saved" }
  /** The request may still reach the backend; the caller must check the saved list before retrying. */
  | { status: "unknown" }
  /** The backend refused the request, so nothing was saved. */
  | { status: "error"; code: string; message: string };

export type CheckProofsResult =
  { status: "ok"; proofs: Proof[] } | { status: "error"; code: string; message: string };

const SESSION_EXPIRED = {
  status: "error",
  code: "session_expired",
  message: "Your session expired.",
} as const;

function validJobId(value: unknown): value is number {
  return (
    typeof value === "number" && Number.isSafeInteger(value) && value > 0 && value <= 2_147_483_647
  );
}

function readProofs(jobId: number) {
  return serverApiGet<Proof[]>(`/api/v1/jobs/${jobId}/proofs`, {
    signal: AbortSignal.timeout(PROOF_READ_TIMEOUT_MS),
  });
}

function revalidateJob(jobId: number) {
  revalidatePath(`/marketer/jobs/${jobId}`);
  revalidatePath(`/creator/jobs/${jobId}`);
}

/**
 * The request failed in transit, timed out or got a server error, so the backend
 * may have saved the link (or may still be saving it). Finding it confirms the
 * save; not finding it is not proof of failure, so the outcome stays unknown and
 * the marketer checks again instead of retrying straight away.
 */
async function unconfirmedSave(jobId: number, url: string): Promise<SaveProofResult> {
  try {
    if ((await readProofs(jobId)).some((proof) => proof.url === url)) {
      revalidateJob(jobId);
      return { status: "saved" };
    }
  } catch {
    // The read failed too; the outcome stays unknown.
  }
  return { status: "unknown" };
}

export async function saveJobProof(jobId: unknown, rawUrl: unknown): Promise<SaveProofResult> {
  if (!validJobId(jobId))
    return { status: "error", code: "job_not_found", message: "This job is not available." };
  const url = typeof rawUrl === "string" ? parseProjectBriefUrl(rawUrl.trim()) : null;
  if (!url)
    return {
      status: "error",
      code: "invalid_proof_url",
      message: "Enter an absolute HTTP or HTTPS proof link.",
    };
  if (!(await getSession())) return SESSION_EXPIRED;

  try {
    await serverApiRequest(`/api/v1/jobs/${jobId}/proofs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, attachment_type: "Proof" }),
      signal: AbortSignal.timeout(PROOF_REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    // A 4xx is the backend's definite answer; anything else leaves the outcome open.
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
      return { status: "error", code: error.code, message: error.message };
    }
    return unconfirmedSave(jobId, url);
  }
  revalidateJob(jobId);
  return { status: "saved" };
}

/** Reads the saved proof list again, for when an earlier save had an unknown result. */
export async function checkJobProofs(jobId: unknown): Promise<CheckProofsResult> {
  if (!validJobId(jobId))
    return { status: "error", code: "job_not_found", message: "This job is not available." };
  if (!(await getSession())) return SESSION_EXPIRED;
  try {
    const proofs = await readProofs(jobId);
    revalidateJob(jobId);
    return { status: "ok", proofs };
  } catch (error) {
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
      return { status: "error", code: error.code, message: error.message };
    }
    return {
      status: "error",
      code: "check_failed",
      message: "The saved proof could not be checked.",
    };
  }
}
