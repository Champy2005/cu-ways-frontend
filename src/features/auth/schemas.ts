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
    (isString(input.phone) && input.phone.length <= 20);
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
    lineIDValid &&
    validMarketerProfile(input.marketer_profile)
  );
}

function validMarketerProfile(value: unknown): boolean {
  if (value === undefined) return true;
  if (!value || typeof value !== "object") return false;
  const profile = value as Record<string, unknown>;
  const text = (field: unknown) =>
    field === undefined || (isString(field) && field.length <= MAX_PROFILE_TEXT);
  const years = profile.experience_years;
  return (
    text(profile.bio) &&
    text(profile.availability_text) &&
    (years === undefined ||
      (Number.isInteger(years) &&
        (years as number) >= 0 &&
        (years as number) <= MAX_EXPERIENCE_YEARS))
  );
}

export function loginFieldErrors(input: LoginRequest): { email?: string; password?: string } {
  const errors: { email?: string; password?: string } = {};
  if (!validEmail(input.email)) errors.email = "Enter a valid email.";
  if (!input.password) errors.password = "Enter your password.";
  return errors;
}

export function registerValidationMessage(input: RegisterRequest): string | null {
  input = normalizeRegisterInput(input);
  if (!input.name.trim() || input.name.length > 100) return "Enter a valid name.";
  if (!validEmail(input.email)) return "Enter a valid email address.";
  if (input.password.length < 8 || input.password.length > 128) {
    return "Password must be between 8 and 128 characters.";
  }
  if (
    input.phone !== undefined &&
    input.phone !== null &&
    (input.phone.trim().length === 0 || input.phone.length > 20)
  ) {
    return "Phone must be between 1 and 20 characters.";
  }
  if (
    input.line_id !== undefined &&
    input.line_id !== null &&
    (input.line_id.trim().length === 0 || input.line_id.length > 50)
  ) {
    return "Line ID must be between 1 and 50 characters.";
  }
  return null;
}

export const MAX_PROFILE_TEXT = 5000;
export const MAX_EXPERIENCE_YEARS = 80;

export type RegistrationRole = "creator" | "marketer";

/** Everything the sign-up wizard collects, as the user typed it. */
export type RegistrationFields = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: RegistrationRole | null;
  accept_terms: boolean;
  accept_privacy: boolean;
  phone: string;
  line_id: string;
  bio: string;
  experience_years: string;
  availability_text: string;
};
export type RegistrationErrors = Partial<Record<keyof RegistrationFields, string>>;

export const EMPTY_REGISTRATION: RegistrationFields = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  password_confirmation: "",
  role: null,
  accept_terms: false,
  accept_privacy: false,
  phone: "",
  line_id: "",
  bio: "",
  experience_years: "",
  availability_text: "",
};

/** The design's placeholder is xxx-xxx-xxxx; the backend stores digits only. */
export function phoneDigits(phone: string): string {
  return phone.replace(/[\s-]/g, "");
}

/** Step 1: personal information, password, role and consent. Wording follows the design. */
export function accountStepErrors(input: RegistrationFields): RegistrationErrors {
  const errors: RegistrationErrors = {};
  const first = input.first_name.trim();
  const last = input.last_name.trim();
  if (!first) errors.first_name = "First name is required.";
  if (!last) errors.last_name = "Last name is required.";
  else if (`${first} ${last}`.length > 100) errors.last_name = "Enter a valid last name.";
  if (!input.email.trim()) errors.email = "Email is required.";
  else if (!validEmail(input.email)) errors.email = "Enter a valid email.";
  if (input.password.length < 8 || input.password.length > 128)
    errors.password = "Password must be 8–128 characters.";
  if (!input.password_confirmation) errors.password_confirmation = "Confirm your password.";
  else if (input.password_confirmation !== input.password)
    errors.password_confirmation = "Passwords don’t match.";
  if (!input.role) errors.role = "Choose a role.";
  if (!input.accept_terms) errors.accept_terms = "Accept the Terms of Service to continue.";
  if (!input.accept_privacy) errors.accept_privacy = "Accept the Privacy Policy to continue.";
  return errors;
}

/** Step 2: contact details. */
export function contactStepErrors(input: RegistrationFields): RegistrationErrors {
  const errors: RegistrationErrors = {};
  const phone = phoneDigits(input.phone.trim());
  if (!phone) errors.phone = "Phone number is required.";
  else if (!/^[0-9]{10}$/.test(phone)) errors.phone = "Phone number must be 10 digits";
  if (input.line_id.trim().length > 50) errors.line_id = "Enter a valid Line ID.";
  return errors;
}

/** Step 3 (marketers only): the starting marketer profile. */
export function experienceStepErrors(input: RegistrationFields): RegistrationErrors {
  const errors: RegistrationErrors = {};
  if (input.bio.trim().length > MAX_PROFILE_TEXT)
    errors.bio = "Bio must be 5,000 characters or fewer.";
  const years = input.experience_years.trim();
  if (years && !(/^[0-9]+$/.test(years) && Number(years) <= MAX_EXPERIENCE_YEARS))
    errors.experience_years = "Enter a whole number from 0 to 80.";
  if (input.availability_text.trim().length > MAX_PROFILE_TEXT)
    errors.availability_text = "Availability must be 5,000 characters or fewer.";
  return errors;
}

export function registrationPayload(input: RegistrationFields): RegisterRequest {
  const payload: RegisterRequest = {
    name: `${input.first_name.trim()} ${input.last_name.trim()}`,
    email: input.email.trim(),
    phone: phoneDigits(input.phone.trim()),
    password: input.password,
    line_id: input.line_id.trim() || null,
  };
  if (input.role === "marketer") {
    const years = input.experience_years.trim();
    payload.marketer_profile = {
      bio: input.bio.trim(),
      availability_text: input.availability_text.trim(),
      ...(years ? { experience_years: Number(years) } : {}),
    };
  }
  return payload;
}
