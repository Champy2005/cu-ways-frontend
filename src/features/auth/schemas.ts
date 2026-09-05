import type { LoginRequest, RegisterRequest } from "@/features/auth/types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function validEmail(value: string): boolean {
  return value.trim().length <= 255 && EMAIL_PATTERN.test(value.trim());
}

function normalizeOptionalContact(value: unknown): unknown {
  return isString(value) && value.trim().length === 0 ? null : value;
}

export function normalizeRegisterInput(value: RegisterRequest): RegisterRequest;
export function normalizeRegisterInput(value: unknown): unknown;
export function normalizeRegisterInput(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;

  const input = value as Record<string, unknown>;
  return {
    ...input,
    phone: normalizeOptionalContact(input.phone),
    line_id: normalizeOptionalContact(input.line_id),
  };
}

export function validateLoginInput(value: unknown): value is LoginRequest {
  if (!value || typeof value !== "object") return false;
  const input = value as Record<string, unknown>;
  return (
    isString(input.email) &&
    validEmail(input.email) &&
    isString(input.password) &&
    input.password.length >= 8 &&
    input.password.length <= 128
  );
}

export function validateRegisterInput(value: unknown): value is RegisterRequest {
  if (!value || typeof value !== "object") return false;
  const input = value as Record<string, unknown>;
  const phoneValid =
    input.phone === undefined ||
    input.phone === null ||
    (isString(input.phone) && input.phone.trim().length > 0 && input.phone.length <= 20);
  const lineIDValid =
    input.line_id === undefined ||
    input.line_id === null ||
    (isString(input.line_id) && input.line_id.trim().length > 0 && input.line_id.length <= 50);

  return (
    isString(input.name) &&
    input.name.trim().length > 0 &&
    input.name.length <= 100 &&
    isString(input.email) &&
    validEmail(input.email) &&
    isString(input.password) &&
    input.password.length >= 8 &&
    input.password.length <= 128 &&
    phoneValid &&
    lineIDValid
  );
}

export function loginValidationMessage(input: LoginRequest): string | null {
  if (!validEmail(input.email)) return "Enter a valid email address.";
  if (input.password.length < 8 || input.password.length > 128) {
    return "Password must be between 8 and 128 characters.";
  }
  return null;
}

export function registerValidationMessage(input: RegisterRequest): string | null {
  input = normalizeRegisterInput(input);
  if (!input.name.trim() || input.name.length > 100) return "Enter a valid name.";
  if (!validEmail(input.email)) return "Enter a valid email address.";
  if (input.password.length < 8 || input.password.length > 128) {
    return "Password must be between 8 and 128 characters.";
  }
  if (input.phone !== undefined && input.phone !== null && (input.phone.trim().length === 0 || input.phone.length > 20)) {
    return "Phone must be between 1 and 20 characters.";
  }
  if (input.line_id !== undefined && input.line_id !== null && (input.line_id.trim().length === 0 || input.line_id.length > 50)) {
    return "Line ID must be between 1 and 50 characters.";
  }
  return null;
}
