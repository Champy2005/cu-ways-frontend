import { ApiError } from "@/lib/api/errors";

export function failureMessage(error: unknown): string {
  if (!(error instanceof ApiError))
    return "Invitations are temporarily unavailable. Please try again.";
  if (error.status === 401) return "Your session expired. Please sign in again.";
  if (error.code === "marketer_profile_required")
    return "A marketer profile is required to view invitations.";
  if (error.status === 403) return "You do not have access to this invitation.";
  if (error.status === 404) return "This invitation could not be found.";
  return error.message;
}
