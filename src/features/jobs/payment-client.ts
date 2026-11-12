import { browserApiRequest } from "@/lib/api/browser-client";
import { isActivePayment, type PaymentMethod } from "./payment";
import type { CheckPaymentResult, RecordPaymentResult } from "./payment-actions";

/**
 * Browser calls to the payment API route. Each request has its own abort
 * timeout, so a response that never arrives can never hold the page: the save
 * becomes "unknown" and the status check fails on its own, independently.
 *
 * The server bounds its backend calls to 25 seconds for a save (save plus one
 * status read) and 10 seconds for a check; these limits sit just above that,
 * so the server's own answer normally arrives first.
 */
export const PAYMENT_SAVE_TIMEOUT_MS = 35_000;
export const PAYMENT_CHECK_TIMEOUT_MS = 15_000;

const UNKNOWN_SAVE: RecordPaymentResult = {
  status: "unknown",
  message:
    "We could not confirm whether the payment was saved. Check the payment status before trying again.",
};

const CHECK_FAILED: CheckPaymentResult = {
  status: "error",
  message: "The payment status could not be checked. Check your connection and try again.",
};

function hasMessage(value: Record<string, unknown>): boolean {
  return typeof value.message === "string" && value.message.length > 0;
}

function isRecordResult(value: unknown, jobId: number): value is RecordPaymentResult {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Record<string, unknown>;
  switch (result.status) {
    case "recorded":
      return isActivePayment(result.payment, jobId) && result.payment.payment_status === "Paid";
    case "existing":
      return isActivePayment(result.payment, jobId) && hasMessage(result);
    case "existing_unconfirmed":
    case "mismatch":
    case "unavailable":
    case "error":
    case "unknown":
      return hasMessage(result);
    default:
      return false;
  }
}

function isCheckResult(value: unknown, jobId: number): value is CheckPaymentResult {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Record<string, unknown>;
  if (result.status === "found") return isActivePayment(result.payment, jobId);
  if (result.status === "none") return true;
  return result.status === "error" && hasMessage(result);
}

/**
 * Saves the payment. Never rejects: a lost, failed, timed-out or unreadable
 * response means the backend may still have saved it, so the result is
 * "unknown" and the Creator checks the real status before trying again.
 */
export async function requestPaymentRecord(
  jobId: number,
  method: PaymentMethod,
  amount: string,
): Promise<RecordPaymentResult> {
  try {
    const result = await browserApiRequest<unknown>(`/api/jobs/${jobId}/payment`, {
      method: "POST",
      body: JSON.stringify({ method, amount }),
      signal: AbortSignal.timeout(PAYMENT_SAVE_TIMEOUT_MS),
    });
    return isRecordResult(result, jobId) ? result : UNKNOWN_SAVE;
  } catch {
    return UNKNOWN_SAVE;
  }
}

/** Reads the job's payment again. Never rejects, so the recovery view stays usable. */
export async function requestPaymentStatus(jobId: number): Promise<CheckPaymentResult> {
  try {
    const result = await browserApiRequest<unknown>(`/api/jobs/${jobId}/payment`, {
      signal: AbortSignal.timeout(PAYMENT_CHECK_TIMEOUT_MS),
    });
    return isCheckResult(result, jobId) ? result : CHECK_FAILED;
  } catch {
    return CHECK_FAILED;
  }
}
