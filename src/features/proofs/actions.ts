"use server";

import { ApiError } from "@/lib/api/errors";
import { serverApiRequest } from "@/lib/api/server-client";
import { getSession } from "@/lib/auth/session";
import { parseProjectBriefUrl } from "@/features/jobs/project-brief";
import { getProofs, jobPath } from "@/features/transactions/queries";

export type SaveProofResult =
  | { status: "saved" }
  /** The request may have reached the server; the caller must re-read the list before retrying. */
  | { status: "unknown" }
  | { status: "error"; code: string; message: string };

/**
 * POST /api/v1/jobs/{id}/proofs (US-026). Definitive 4xx answers are returned with their
 * backend `code` so the UI can explain them; transport/5xx failures are reconciled
 * against the authoritative proof list before reporting.
 */
export async function saveProof(jobId: string, rawUrl: string): Promise<SaveProofResult> {
  if (!(await getSession()))
    return { status: "error", code: "session_expired", message: "Your session expired." };

  const url = typeof rawUrl === "string" ? parseProjectBriefUrl(rawUrl.trim()) : null;
  if (!url)
    return {
      status: "error",
      code: "invalid_proof_url",
      message: "Enter an absolute HTTP or HTTPS proof link.",
    };

  let path: string;
  try {
    path = `${jobPath(jobId)}/proofs`;
  } catch (error) {
    const apiError = error as ApiError;
    return { status: "error", code: apiError.code, message: apiError.message };
  }

  try {
    await serverApiRequest(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, attachment_type: "Proof" }),
    });
    return { status: "saved" };
  } catch (error) {
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
      return { status: "error", code: error.code, message: error.message };
    }
    try {
      const saved = await getProofs(jobId);
      if (saved.some((proof) => proof.url === url)) return { status: "saved" };
      return { status: "error", code: "server_error", message: "The proof was not saved." };
    } catch {
      return { status: "unknown" };
    }
  }
}
