import { ApiError } from "@/lib/api/errors";

import type { ServiceFieldErrors } from "./service-fields";

/** Accept backend field messages while leaving unknown detail formats in the summary. */
export function serviceFieldErrors(error: unknown): ServiceFieldErrors {
  if (!(error instanceof ApiError) || !error.details || typeof error.details !== "object")
    return {};
  const details = error.details as Record<string, unknown>;
  const fields = (details.fields ?? details) as Record<string, unknown>;
  const errors: ServiceFieldErrors = {};
  for (const field of ["service_type", "scope_text", "price"] as const) {
    if (typeof fields[field] === "string") errors[field] = fields[field];
  }
  return errors;
}
