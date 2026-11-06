import type { components } from "@/lib/api/generated/backend";
import type { CreatorJobSummary } from "@/features/jobs/types";

export type PaymentMethod = components["schemas"]["CreatePaymentRequest"]["method"];
export type RecordedPayment = components["schemas"]["PaymentResponse"]["data"];

export const PAYMENT_METHODS = [
  "PromptPay",
  "Bank Transfer",
  "Credit Card",
] as const satisfies readonly PaymentMethod[];

/** Statuses the backend accepts a payment for (createJobPayment). */
export const PAYABLE_JOB_STATUSES: readonly CreatorJobSummary["job_status"][] = [
  "Accepted",
  "In Progress",
  "Completed",
];

// Same shape the backend accepts: up to 8 whole digits and 2 decimal places.
const AMOUNT_PATTERN = /^(\d{1,8})(?:\.(\d{1,2}))?$/;

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === "string" && (PAYMENT_METHODS as readonly string[]).includes(value);
}

/** Parses a decimal amount into whole satang so comparisons never use floats. */
export function toSatang(value: string): number | null {
  const match = AMOUNT_PATTERN.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
}

export function formatSatang(satang: number): string {
  return `฿${(satang / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export type PaymentFormValues = { method: string; amount: string };
export type PaymentFormErrors = { method?: string; amount?: string };

export function amountMismatchMessage(acceptedSatang: number): string {
  return `The amount must be exactly ${formatSatang(acceptedSatang)}, the accepted offer price.`;
}

export function validatePaymentForm(
  values: PaymentFormValues,
  acceptedSatang: number,
): PaymentFormErrors {
  const errors: PaymentFormErrors = {};
  if (!isPaymentMethod(values.method)) errors.method = "Choose a payment method.";

  const raw = values.amount.trim();
  const satang = toSatang(raw);
  if (!raw) errors.amount = "Enter the payment amount.";
  else if (satang === null || satang <= 0) {
    errors.amount = "Enter a positive amount in THB with up to two decimal places.";
  } else if (satang !== acceptedSatang) errors.amount = amountMismatchMessage(acceptedSatang);
  return errors;
}
