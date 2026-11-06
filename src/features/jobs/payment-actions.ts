"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api/errors";
import { serverApiRequest } from "@/lib/api/server-client";
import { getSession } from "@/lib/auth/session";
import { isPaymentMethod, toSatang, type RecordedPayment } from "@/features/jobs/payment";

export type RecordPaymentResult =
  | { status: "recorded"; payment: RecordedPayment }
  /** The backend already holds a Pending or Paid payment, so nothing new was created. */
  | { status: "already_recorded"; message: string }
  /** The backend rejected the amount because it differs from the accepted offer price. */
  | { status: "mismatch"; message: string }
  /** The job can no longer take a payment (status or accepted offer changed). */
  | { status: "unavailable"; message: string }
  /** Nothing was recorded, or the outcome is unknown. Retrying is safe: duplicates are rejected. */
  | { status: "error"; message: string };

const SESSION_EXPIRED = "Your session expired. Sign in again to continue.";
const NO_ACCESS = "You no longer have access to this job. Return to your jobs to continue.";

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

function mapPaymentError(error: unknown): RecordPaymentResult {
  if (!(error instanceof ApiError)) {
    return {
      status: "error",
      message:
        "We could not confirm the payment. Try again; a payment that was already saved will not be recorded twice.",
    };
  }
  switch (error.code) {
    case "payment_already_exists":
      return {
        status: "already_recorded",
        message: "A payment has already been recorded for this job. No new payment was created.",
      };
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
    });
  } catch (error) {
    return mapPaymentError(error);
  }
  if (!isRecordedPayment(payment, jobId)) {
    return {
      status: "error",
      message:
        "The payment response could not be read. Reload the page before trying again; a duplicate will not be recorded.",
    };
  }
  revalidatePath(`/creator/jobs/${jobId}`);
  revalidatePath(`/creator/jobs/${jobId}/payment`);
  return { status: "recorded", payment };
}
