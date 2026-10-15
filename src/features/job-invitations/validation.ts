import type { DeclineInput, OfferErrors, OfferInput } from "./types";

export const DECLINE_REASONS = [
  "Schedule conflict",
  "Budget too low",
  "Target audience mismatch",
  "Fully booked",
] as const;
export const MESSAGE_LIMIT = 300;

export function isOfferPrice(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d+(?:\.\d{1,2})?$/.test(value)) return false;
  return value.split(".")[0].replace(/^0+/, "").length <= 8;
}

export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function validateOffer(
  input: OfferInput,
  deadline: string,
  minimumDate: string,
): OfferErrors {
  const errors: OfferErrors = {};
  if (!isOfferPrice(input.price.trim()))
    errors.price = "Enter a price from ฿0 to ฿99,999,999.99 with at most two decimal places.";
  if (!isCalendarDate(input.deliveryDate))
    errors.deliveryDate = "Choose an estimated delivery date.";
  else if (input.deliveryDate < minimumDate)
    errors.deliveryDate = "Delivery date cannot be before today.";
  else if (input.deliveryDate > deadline)
    errors.deliveryDate = "Delivery date cannot be after the job deadline.";
  if (input.message.length > MESSAGE_LIMIT)
    errors.message = `Keep your message to ${MESSAGE_LIMIT} characters or fewer.`;
  return errors;
}

export function normalizeOffer(input: OfferInput): OfferInput {
  const [whole, fraction = ""] = input.price.trim().split(".");
  return {
    price: `${whole.replace(/^0+(?=\d)/, "")}.${fraction.padEnd(2, "0")}`,
    deliveryDate: input.deliveryDate,
    message: input.message.trim(),
  };
}

export function validDecline(input: DeclineInput): boolean {
  return (
    (input.reason === null || DECLINE_REASONS.some((reason) => reason === input.reason)) &&
    input.note.length <= MESSAGE_LIMIT
  );
}
