import { isRecord } from "@/lib/api/envelope";
import type { FormResult, ProfileInput, ServiceInput } from "@/features/marketers/types";

export const SERVICE_TYPES = [
  "On-Campus Distribution",
  "Targeted Faculty Outreach",
  "Online Campus Communities",
  "General Survey Boost",
] as const;

export function isNullableText(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

export function isNonnegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function isDecimalAmount(value: unknown): value is string {
  return typeof value === "string" && /^\d+(?:\.\d{1,2})?$/.test(value);
}

export function isServicePrice(value: unknown): value is string {
  if (!isDecimalAmount(value)) return false;
  const integerPart = value.split(".")[0].replace(/^0+/, "");
  return integerPart.length <= 8;
}

function hasExactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  return Object.keys(value).length === keys.length && keys.every((key) => key in value);
}

export function validateProfileInput(value: unknown): value is ProfileInput {
  if (!isRecord(value)) return false;
  return (
    hasExactKeys(value, ["bio", "experience_years", "availability_text"]) &&
    isNullableText(value.bio) &&
    (value.experience_years === null || isNonnegativeNumber(value.experience_years)) &&
    isNullableText(value.availability_text)
  );
}

function isServiceType(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 100;
}

export function validateServiceInput(value: unknown): value is ServiceInput {
  if (!isRecord(value)) return false;
  return (
    hasExactKeys(value, ["service_type", "scope_text", "price"]) &&
    isServiceType(value.service_type) &&
    isNullableText(value.scope_text) &&
    isServicePrice(value.price)
  );
}

export function parseProfileForm(input: {
  bio: string;
  experience_years: string;
  availability_text: string;
}): FormResult<ProfileInput> {
  const years = input.experience_years.trim();
  if (years && (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(years) || !Number.isFinite(Number(years)))) {
    return {
      success: false,
      errors: { experience_years: "Enter a valid number of years, zero or greater." },
    };
  }
  return {
    success: true,
    data: {
      bio: input.bio.trim() || null,
      experience_years: years ? Number(years) : null,
      availability_text: input.availability_text.trim() || null,
    },
  };
}

function canonicalPrice(value: string): string {
  const [whole, fraction = ""] = value.split(".");
  return `${whole.replace(/^0+(?=\d)/, "")}.${fraction.padEnd(2, "0")}`;
}

export function parseServiceForm(input: {
  service_type: string;
  scope_text: string;
  price: string;
}): FormResult<ServiceInput> {
  const serviceType = input.service_type.trim();
  const price = input.price.trim();
  const errors: Partial<Record<keyof ServiceInput, string>> = {};
  if (!isServiceType(serviceType)) {
    errors.service_type = serviceType
      ? "Service name must be 100 characters or fewer."
      : "Choose a service type or enter a custom service name.";
  }
  if (!isServicePrice(price)) {
    errors.price = "Enter a price from ฿0 to ฿99,999,999.99 with at most two decimal places.";
  }
  if (Object.keys(errors).length > 0) return { success: false, errors };
  return {
    success: true,
    data: {
      service_type: serviceType,
      scope_text: input.scope_text.trim() ? input.scope_text : null,
      price: canonicalPrice(price),
    },
  };
}
