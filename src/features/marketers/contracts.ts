import { ApiError } from "@/lib/api/errors";
import { isRecord } from "@/lib/api/envelope";
import {
  isDecimalAmount,
  isNonnegativeNumber,
  validateProfileInput,
  validateServiceInput,
} from "@/features/marketers/schemas";
import type {
  MarketerProfile,
  MarketerStats,
  PublicCatalog,
  Service,
} from "@/features/marketers/types";

export function invalidContract(): never {
  throw new ApiError(
    502,
    "invalid_backend_response",
    "Marketer data is temporarily unavailable. Please try again later.",
  );
}

export function isPositiveId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export function readMarketerProfile(value: unknown): MarketerProfile {
  if (!isRecord(value) || !isPositiveId(value.user_id) || typeof value.name !== "string") {
    return invalidContract();
  }
  const profile = {
    bio: value.bio,
    experience_years: value.experience_years,
    availability_text: value.availability_text,
  };
  if (!validateProfileInput(profile)) return invalidContract();
  // Never infer numeric years from the legacy text `experience` field.
  if (
    profile.experience_years === null &&
    typeof value.experience === "string" &&
    value.experience.trim()
  ) {
    return invalidContract();
  }
  return { user_id: value.user_id, name: value.name, ...profile };
}

export function readService(value: unknown): Service {
  if (!isRecord(value) || !isPositiveId(value.service_id) || !isPositiveId(value.user_id)) {
    return invalidContract();
  }
  const input = {
    service_type: value.service_type,
    scope_text: value.scope_text,
    price: value.price,
  };
  if (!validateServiceInput(input) || typeof value.created_at !== "string") {
    return invalidContract();
  }
  return {
    service_id: value.service_id,
    user_id: value.user_id,
    ...input,
    created_at: value.created_at,
  };
}

export function readServices(value: unknown): Service[] {
  if (!Array.isArray(value)) return invalidContract();
  return value.map(readService);
}

export function readMarketerStats(value: unknown): MarketerStats {
  if (!isRecord(value)) return invalidContract();
  const { total_jobs_completed, average_rating, total_earnings } = value;
  if (!isNonnegativeNumber(total_jobs_completed) || !Number.isSafeInteger(total_jobs_completed)) {
    return invalidContract();
  }
  if (
    !isNonnegativeNumber(average_rating) ||
    average_rating > 5 ||
    !isDecimalAmount(total_earnings)
  ) {
    return invalidContract();
  }
  return { total_jobs_completed, average_rating, total_earnings };
}

export function readPublicCatalog(value: unknown): PublicCatalog {
  if (!isRecord(value) || !isRecord(value.marketer)) return invalidContract();
  const { user_id, name } = value.marketer;
  if (!isPositiveId(user_id) || typeof name !== "string") return invalidContract();
  const services = readServices(value.services);
  if (services.some((service) => service.user_id !== user_id)) return invalidContract();
  // Project only public fields even if a future backend accidentally includes private statistics.
  return { marketer: { user_id, name }, services };
}
