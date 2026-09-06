import {
  handleAuthRequest,
  normalizeRegisterInput,
  validateRegisterInput,
} from "@/lib/api/auth-route";

export function POST(request: Request): Promise<Response> {
  return handleAuthRequest(
    request,
    "/api/v1/auth/register",
    validateRegisterInput,
    normalizeRegisterInput,
  );
}
