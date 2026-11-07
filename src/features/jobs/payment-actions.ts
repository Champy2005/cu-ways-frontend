"use server";

import { revalidatePath } from "next/cache";
import { getCurrentJobPayment } from "@/features/jobs/api";
import {
  SESSION_EXPIRED,
  accessErrorMessage,
  checkJobRecord,
  saveJobRecord,
  validJobId,
} from "@/features/jobs/job-record-save";
import type { ApiError } from "@/lib/api/errors";
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

function isRecordedPayment(value: unknown, jobId: number): value is RecordedPayment {
  if (typeof value !== "object" || value === null) return false;
  const payment = value as Partial<RecordedPayment>;
  return (
    validJobId(payment.payment_id) &&
    payment.job_id === jobId &&
    isPaymentMethod(payment.method) &&
    typeof payment.amount === "string" &&
    payment.payment_status === "Paid" &&
    typeof payment.paid_at === "string"
  );
}

function revalidatePaymentPaths(jobId: number) {
  revalidatePath(`/creator/jobs/${jobId}`);
  revalidatePath(`/creator/jobs/${jobId}/payment`);
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
  return {
    status: "error",
    message: accessErrorMessage(error) ?? "The payment could not be recorded. Please try again.",
  };
}

export async function recordJobPayment(
  jobId: unknown,
  method: unknown,
  amount: unknown,
): Promise<RecordPaymentResult> {
  if (!validJobId(jobId)) return { status: "error", message: "This job is not available." };
  if (!isPaymentMethod(method) || typeof amount !== "string" || toSatang(amount) === null) {
    return { status: "error", message: "Check the payment method and amount, then try again." };
  }
  if (!(await getSession())) return { status: "error", message: SESSION_EXPIRED };

  const result = await saveJobRecord({
    path: `/api/v1/jobs/${jobId}/payments`,
    body: { method, amount: amount.trim() },
    isSaved: (value): value is RecordedPayment => isRecordedPayment(value, jobId),
    readCurrent: () => getCurrentJobPayment(jobId),
    duplicateCode: "payment_already_exists",
  });
  switch (result.status) {
    case "saved":
      revalidatePaymentPaths(jobId);
      return { status: "recorded", payment: result.record };
    case "existing":
      revalidatePaymentPaths(jobId);
      return {
        status: "existing",
        payment: result.record,
        message: result.afterUnclearRequest
          ? "This payment is saved for this job."
          : "This job already has a payment, so no new payment was created.",
      };
    case "existing_unconfirmed":
      return {
        status: "existing_unconfirmed",
        message:
          "This job already has a payment, but its details could not be confirmed. Check the payment status to see it.",
      };
    case "unknown":
      return {
        status: "unknown",
        message:
          "We could not confirm whether the payment was saved. Check the payment status before trying again.",
      };
    case "rejected":
      return mapPaymentError(result.error);
  }
}

/** Reads the job's payment again, for when an earlier request had an unknown result. */
export async function checkJobPayment(jobId: unknown): Promise<CheckPaymentResult> {
  if (!validJobId(jobId)) return { status: "error", message: "This job is not available." };
  if (!(await getSession())) return { status: "error", message: SESSION_EXPIRED };
  const result = await checkJobRecord(
    () => getCurrentJobPayment(jobId),
    "The payment status could not be checked. Check your connection and try again.",
  );
  if (result.status !== "found") return result;
  revalidatePaymentPaths(jobId);
  return { status: "found", payment: result.record };
}
