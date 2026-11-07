"use server";

import { revalidatePath } from "next/cache";
import { getCurrentJobPayment } from "@/features/jobs/api";
import { ApiError } from "@/lib/api/errors";
import { serverApiRequest } from "@/lib/api/server-client";
import { getSession } from "@/lib/auth/session";
import {
  isPaymentMethod,
  toSatang,
  type ActivePayment,
  type RecordedPayment,
} from "@/features/jobs/payment";

export type RecordPaymentResult =
  | { status: "recorded"; payment: RecordedPayment }
  /** The job already had a Pending or Paid payment; it is the one read back from the backend. */
  | { status: "existing"; payment: ActivePayment; message: string }
  /** The backend refused a duplicate, but the existing payment could not be read. */
  | { status: "existing_unconfirmed"; message: string }
  /** The backend rejected the amount because it differs from the accepted offer price. */
  | { status: "mismatch"; message: string }
  /** The job can no longer take a payment (status or accepted offer changed). */
  | { status: "unavailable"; message: string }
  /** The backend refused the request, so nothing was recorded. Retrying is safe. */
  | { status: "error"; message: string }
  /** The request failed or timed out and no saved payment was found yet, so the outcome is unknown. */
  | { status: "unknown"; message: string };

export type CheckPaymentResult =
  | { status: "found"; payment: ActivePayment }
  | { status: "none" }
  | { status: "error"; message: string };

/**
 * A stalled backend must not hold the Creator in a pending state indefinitely.
 * Every backend call here is bounded: the save, the read that reconciles an
 * unclear save, and the manual status check. The worst case for one action is
 * the save plus one read (25 seconds), which stays inside the page's own
 * deadline (PAYMENT_ACTION_DEADLINE_MS) so the server result normally wins.
 */
const PAYMENT_REQUEST_TIMEOUT_MS = 15_000;
const PAYMENT_READ_TIMEOUT_MS = 10_000;

function readCurrentPaymentWithin(jobId: number): Promise<ActivePayment | null> {
  return getCurrentJobPayment(jobId, { signal: AbortSignal.timeout(PAYMENT_READ_TIMEOUT_MS) });
}

const SESSION_EXPIRED = "Your session expired. Sign in again to continue.";
const NO_ACCESS = "You no longer have access to this job. Return to your jobs to continue.";
const ALREADY_EXISTS = "This job already has a payment, so no new payment was created.";
const UNKNOWN_OUTCOME =
  "We could not confirm whether the payment was saved. Check the payment status before trying again.";

function validId(value: unknown): value is number {
  return (
    typeof value === "number" && Number.isSafeInteger(value) && value > 0 && value <= 2_147_483_647
  );
}

function isRecordedPayment(value: unknown, jobId: number): value is RecordedPayment {
  if (typeof value !== "object" || value === null) return false;
  const payment = value as Partial<RecordedPayment>;
  return (
    validId(payment.payment_id) &&
    payment.job_id === jobId &&
    isPaymentMethod(payment.method) &&
    typeof payment.amount === "string" &&
    payment.payment_status === "Paid" &&
    typeof payment.paid_at === "string"
  );
}

async function readCurrentPayment(jobId: number): Promise<ActivePayment | null | undefined> {
  try {
    return await readCurrentPaymentWithin(jobId);
  } catch {
    // Failed or timed out: the outcome stays unknown rather than assumed.
    return undefined;
  }
}

function revalidatePaymentPaths(jobId: number) {
  revalidatePath(`/creator/jobs/${jobId}`);
  revalidatePath(`/creator/jobs/${jobId}/payment`);
}

/** After a 409, read the real payment so a Pending record is never shown as Paid. */
async function existingPaymentResult(jobId: number): Promise<RecordPaymentResult> {
  const payment = await readCurrentPayment(jobId);
  if (!payment) {
    return {
      status: "existing_unconfirmed",
      message:
        "This job already has a payment, but its details could not be confirmed. Check the payment status to see it.",
    };
  }
  revalidatePaymentPaths(jobId);
  return { status: "existing", payment, message: ALREADY_EXISTS };
}

/**
 * The request failed in transit or timed out, so check whether the payment was
 * saved anyway. Finding none is not proof it failed: a timed-out request may
 * still be saving, so the Creator checks again instead of being told it failed.
 */
async function unconfirmedRequestResult(jobId: number): Promise<RecordPaymentResult> {
  const payment = await readCurrentPayment(jobId);
  if (!payment) return { status: "unknown", message: UNKNOWN_OUTCOME };
  revalidatePaymentPaths(jobId);
  return { status: "existing", payment, message: "This payment is saved for this job." };
}

function mapPaymentError(error: ApiError): RecordPaymentResult {
  switch (error.code) {
    case "payment_amount_mismatch":
      return {
        status: "mismatch",
        message:
          "The amount does not match the accepted offer price. Check the amount and try again.",
      };
    case "job_not_payable":
      return {
        status: "unavailable",
        message:
          "This job can no longer take a payment. Return to the job to see its latest status.",
      };
    case "accepted_offer_required":
      return {
        status: "unavailable",
        message: "This job no longer has an accepted offer, so a payment cannot be recorded.",
      };
    case "validation_error":
      return {
        status: "error",
        message: "Check the payment method and amount, then try again.",
      };
  }
  if (error.status === 401) return { status: "error", message: SESSION_EXPIRED };
  if (error.status === 403 || error.status === 404) return { status: "error", message: NO_ACCESS };
  return {
    status: "error",
    message: "The payment could not be recorded. Please try again.",
  };
}

export async function recordJobPayment(
  jobId: unknown,
  method: unknown,
  amount: unknown,
): Promise<RecordPaymentResult> {
  if (!validId(jobId)) return { status: "error", message: "This job is not available." };
  if (!isPaymentMethod(method) || typeof amount !== "string" || toSatang(amount) === null) {
    return { status: "error", message: "Check the payment method and amount, then try again." };
  }
  if (!(await getSession())) return { status: "error", message: SESSION_EXPIRED };

  let payment: unknown;
  try {
    payment = await serverApiRequest<unknown>(`/api/v1/jobs/${jobId}/payments`, {
      method: "POST",
      body: JSON.stringify({ method, amount: amount.trim() }),
      signal: AbortSignal.timeout(PAYMENT_REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (!(error instanceof ApiError)) return unconfirmedRequestResult(jobId);
    if (error.code === "payment_already_exists") return existingPaymentResult(jobId);
    return mapPaymentError(error);
  }
  if (!isRecordedPayment(payment, jobId)) return unconfirmedRequestResult(jobId);
  revalidatePaymentPaths(jobId);
  return { status: "recorded", payment };
}

/** Reads the job's payment again, for when an earlier request had an unknown result. */
export async function checkJobPayment(jobId: unknown): Promise<CheckPaymentResult> {
  if (!validId(jobId)) return { status: "error", message: "This job is not available." };
  if (!(await getSession())) return { status: "error", message: SESSION_EXPIRED };
  try {
    const payment = await readCurrentPaymentWithin(jobId);
    if (!payment) return { status: "none" };
    revalidatePaymentPaths(jobId);
    return { status: "found", payment };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return { status: "error", message: SESSION_EXPIRED };
    }
    if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
      return { status: "error", message: NO_ACCESS };
    }
    return {
      status: "error",
      message: "The payment status could not be checked. Check your connection and try again.",
    };
  }
}
