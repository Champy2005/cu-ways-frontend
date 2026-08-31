import type { components } from "@/lib/api/generated/backend";

type ErrorEnvelope = components["schemas"]["ErrorResponse"];

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function isErrorEnvelope(value: unknown): value is ErrorEnvelope {
  if (!value || typeof value !== "object") return false;

  const envelope = value as Record<string, unknown>;
  const error = envelope.error;
  if (!error || typeof error !== "object") return false;

  const errorBody = error as Record<string, unknown>;
  return (
    envelope.status === "error" &&
    typeof errorBody.code === "string" &&
    typeof errorBody.message === "string"
  );
}

export function apiErrorFromResponse(status: number, payload: unknown): ApiError {
  if (isErrorEnvelope(payload)) {
    return new ApiError(
      status,
      payload.error.code,
      payload.error.message,
      payload.error.details,
    );
  }

  return new ApiError(status, "request_failed", "The request could not be completed");
}

export function getDisplayError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
