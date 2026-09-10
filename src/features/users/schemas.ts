import type { UpdateUserRequest } from "@/features/users/types";

function isNullableString(value: unknown, maximumLength: number): boolean {
  return value === null || (typeof value === "string" && value.length <= maximumLength);
}

export function validateContactUpdate(value: unknown): value is UpdateUserRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const input = value as Record<string, unknown>;
  const keys = Object.keys(input);
  return (
    keys.length === 2 &&
    keys.every((key) => key === "phone" || key === "line_id") &&
    typeof input.phone === "string" &&
    input.phone.trim().length > 0 &&
    input.phone.length <= 20 &&
    isNullableString(input.line_id, 50)
  );
}

export function normalizeContactUpdate(input: {
  phone: string;
  line_id: string;
}): UpdateUserRequest {
  return {
    phone: input.phone.trim() || null,
    line_id: input.line_id.trim() || null,
  };
}

export function contactValidationMessage(input: UpdateUserRequest): string | null {
  if (!input.phone?.trim()) return "Phone number is required.";
  if (input.phone.length > 20) {
    return "Phone must be 20 characters or fewer.";
  }
  if (input.line_id && input.line_id.length > 50) {
    return "LINE ID must be 50 characters or fewer.";
  }
  return null;
}
