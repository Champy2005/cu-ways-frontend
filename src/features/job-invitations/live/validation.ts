import { isRecord } from "@/lib/api/envelope";
import type { DeclineInput, OfferInput } from "../types";
import { DECLINE_REASONS, isCalendarDate, isOfferPrice, MESSAGE_LIMIT } from "../validation";

export function characterCount(value: string): number {
  return Array.from(value).length;
}

export function safeExternalUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function isRequestId(value: string): boolean {
  return /^[1-9]\d*$/.test(value) && Number(value) <= 2_147_483_647;
}

export function offerErrors(input: OfferInput, today: string, deadline: string | null) {
  const errors: Partial<Record<keyof OfferInput, string>> = {};
  if (!isOfferPrice(input.price.trim()))
    errors.price = "Enter a price from ฿0 to ฿99,999,999.99 with at most two decimal places.";
  if (!isCalendarDate(input.deliveryDate)) errors.deliveryDate = "Choose a valid delivery date.";
  else if (input.deliveryDate < today)
    errors.deliveryDate = "Delivery date cannot be before today.";
  else if (deadline && input.deliveryDate > deadline)
    errors.deliveryDate = "Delivery date cannot be after the job deadline.";
  if (characterCount(input.message.trim()) > MESSAGE_LIMIT)
    errors.message = "Keep your message to 300 characters or fewer.";
  return errors;
}

export function validLiveDecline(value: unknown): value is DeclineInput {
  if (!isRecord(value) || Object.keys(value).some((key) => !["reason", "note"].includes(key)))
    return false;
  return (
    (value.reason === null || DECLINE_REASONS.some((reason) => reason === value.reason)) &&
    typeof value.note === "string" &&
    characterCount(value.note.trim()) <= MESSAGE_LIMIT
  );
}

export function validOfferBody(value: unknown): boolean {
  if (
    !isRecord(value) ||
    Object.keys(value).some((key) => !["offered_price", "delivery_date", "message"].includes(key))
  )
    return false;
  return (
    typeof value.offered_price === "string" &&
    /^\d{1,8}(?:\.\d{1,2})?$/.test(value.offered_price) &&
    isCalendarDate(value.delivery_date) &&
    (value.message === null ||
      (typeof value.message === "string" && characterCount(value.message) <= MESSAGE_LIMIT))
  );
}
