import type { UpdateUserRequest } from "@/features/users/types";

/** A Thai mobile number: the backend stores exactly 10 digits. */
export const PHONE_DIGITS = 10;
const PHONE_PATTERN = /^[0-9]{10}$/;

function isNullableString(value: unknown, maximumLength: number): boolean {
  return value === null || (typeof value === "string" && value.length <= maximumLength);
}

/** People type 088-888-8989 or 088 888 8989; only the digits are sent. */
export function phoneDigits(phone: string): string {
  return phone.replace(/[\s-]/g, "");
}

/** Shows a stored 10-digit phone as xxx-xxx-xxxx, as the design does. */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  return PHONE_PATTERN.test(phone)
    ? `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`
    : phone;
}

export function validateContactUpdate(value: unknown): value is UpdateUserRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const input = value as Record<string, unknown>;
  const keys = Object.keys(input);
  return (
    keys.length === 2 &&
    typeof input.phone === "string" &&
    PHONE_PATTERN.test(input.phone) &&
    isNullableString(input.line_id, 50)
  );
}

export function normalizeContactUpdate(input: {
  phone: string;
  line_id: string;
}): UpdateUserRequest {
  return {
    phone: phoneDigits(input.phone.trim()),
    line_id: input.line_id.trim() || null,
  };
}

/** The phone rule on its own, worded as in the contact-settings design. */
export function phoneValidationMessage(phone: string | undefined): string | null {
  if (!phone?.trim()) return "Phone number is required.";
  if (!PHONE_PATTERN.test(phoneDigits(phone.trim()))) return "Phone number must be 10 digits";
  return null;
}

export function lineIDValidationMessage(lineID: string | null | undefined): string | null {
  return lineID && lineID.length > 50 ? "LINE ID must be 50 characters or fewer." : null;
}

export function contactValidationMessage(input: UpdateUserRequest): string | null {
  return phoneValidationMessage(input.phone) ?? lineIDValidationMessage(input.line_id);
}
