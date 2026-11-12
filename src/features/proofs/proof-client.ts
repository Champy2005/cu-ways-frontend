import { browserApiRequest } from "@/lib/api/browser-client";
import type { Proof } from "@/features/transactions/types";
import type { CheckProofsResult, SaveProofResult } from "./proof-actions";
import { PROOF_CHECK_TIMEOUT_MS, PROOF_SAVE_DEADLINE_MS } from "./proof-limits";

/**
 * Browser calls to the proof API route. Each request has its own abort timeout,
 * so a response that never arrives cannot hold the page: the save becomes
 * "unknown" (A03, 12 s) and the list check fails on its own, independently.
 */

const UNKNOWN_SAVE: SaveProofResult = { status: "unknown" };
const CHECK_FAILED: CheckProofsResult = {
  status: "error",
  code: "check_failed",
  message: "The saved proof could not be checked.",
};

function isErrorResult(result: Record<string, unknown>): boolean {
  return typeof result.code === "string" && typeof result.message === "string";
}

function isProof(value: unknown): value is Proof {
  if (typeof value !== "object" || value === null) return false;
  const proof = value as Record<string, unknown>;
  return (
    typeof proof.attachment_id === "number" &&
    typeof proof.url === "string" &&
    typeof proof.upload_at === "string"
  );
}

function isSaveResult(value: unknown): value is SaveProofResult {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Record<string, unknown>;
  if (result.status === "saved" || result.status === "unknown") return true;
  return result.status === "error" && isErrorResult(result);
}

function isCheckResult(value: unknown): value is CheckProofsResult {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Record<string, unknown>;
  if (result.status === "ok") return Array.isArray(result.proofs) && result.proofs.every(isProof);
  return result.status === "error" && isErrorResult(result);
}

/**
 * Saves the proof link. Never rejects: a lost, failed, timed-out or unreadable
 * response means the backend may still save it, so the result is "unknown" and
 * the marketer checks the saved list before trying again.
 */
export async function requestProofSave(jobId: number, url: string): Promise<SaveProofResult> {
  try {
    const result = await browserApiRequest<unknown>(`/api/jobs/${jobId}/proofs`, {
      method: "POST",
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(PROOF_SAVE_DEADLINE_MS),
    });
    return isSaveResult(result) ? result : UNKNOWN_SAVE;
  } catch {
    return UNKNOWN_SAVE;
  }
}

/** Reads the saved proof list again. Never rejects, so the recovery view stays usable. */
export async function requestProofCheck(jobId: number): Promise<CheckProofsResult> {
  try {
    const result = await browserApiRequest<unknown>(`/api/jobs/${jobId}/proofs`, {
      signal: AbortSignal.timeout(PROOF_CHECK_TIMEOUT_MS),
    });
    return isCheckResult(result) ? result : CHECK_FAILED;
  } catch {
    return CHECK_FAILED;
  }
}
