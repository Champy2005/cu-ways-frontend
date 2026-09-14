import { ApiError } from "@/lib/api/errors";
import type { MarketerFailure } from "./components/route-feedback";

export function marketerFailure(error: unknown): MarketerFailure {
  if (!(error instanceof ApiError)) return "unavailable";
  if (error.status === 401) return "unauthorized";
  if (
    [
      "not_a_marketer",
      "not_marketer",
      "marketer_required",
      "marketer_profile_required",
      "marketer_profile_not_found",
    ].includes(error.code)
  )
    return "ineligible";
  if (error.status === 403) return "forbidden";
  if (error.code === "marketer_not_found") return "missing";
  // Only known domain error codes are safe to treat as missing profiles or eligibility.
  return "unavailable";
}
