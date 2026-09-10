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

export const AVAILABILITY_STATUSES = ["available", "limited", "unavailable"] as const;

function requiredText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 5000;
}
function slugList(value: unknown): boolean {
  return (
    value === undefined ||
    (Array.isArray(value) &&
      value.every(
        (slug) => typeof slug === "string" && slug.trim().length > 0 && slug.length <= 80,
      ))
  );
}
export function validateProfileInput(value: unknown): value is ProfileInput {
  if (!isRecord(value)) return false;
  const allowed = [
    "bio",
    "experience_years",
    "availability_status",
    "availability_text",
    "expertise",
    "campuses",
  ];
  return (
    Object.keys(value).every((key) => allowed.includes(key)) &&
    requiredText(value.bio) &&
    requiredText(value.availability_text) &&
    isNonnegativeNumber(value.experience_years) &&
    Number.isInteger(value.experience_years) &&
    value.experience_years <= 80 &&
    AVAILABILITY_STATUSES.some((status) => status === value.availability_status) &&
    slugList(value.expertise) &&
    slugList(value.campuses)
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
    (value.scope_text === null || value.scope_text.length <= 5000) &&
    isServicePrice(value.price)
  );
}

export function parseProfileForm(input: {
  bio: string;
  experience_years: string;
  availability_text: string;
  availability_status: string;
}): FormResult<ProfileInput> {
  const years = input.experience_years.trim();
  const errors: Partial<Record<keyof ProfileInput, string>> = {};
  if (!requiredText(input.bio.trim())) errors.bio = "Enter a bio of 1–5,000 characters.";
  if (!requiredText(input.availability_text.trim()))
    errors.availability_text = "Enter availability details of 1–5,000 characters.";
  if (!/^\d+$/.test(years) || Number(years) > 80)
    errors.experience_years = "Enter a whole number of years from 0 to 80.";
  const status = AVAILABILITY_STATUSES.find((value) => value === input.availability_status);
  if (!status) errors.availability_status = "Choose your availability status.";
  if (Object.keys(errors).length || !status) return { success: false, errors };
  return {
    success: true,
    data: {
      bio: input.bio.trim(),
      experience_years: Number(years),
      availability_text: input.availability_text.trim(),
      availability_status: status,
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
  if (input.scope_text.length > 5000)
    errors.scope_text = "Scope must be 5,000 characters or fewer.";
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
