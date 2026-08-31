import { browserApiRequest } from "@/lib/api/browser-client";
import type { LoginRequest, RegisterRequest } from "@/features/auth/types";
import type { AuthSessionResponse } from "@/features/auth/types";

export function login(input: LoginRequest): Promise<AuthSessionResponse> {
  return browserApiRequest<AuthSessionResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function register(input: RegisterRequest): Promise<AuthSessionResponse> {
  return browserApiRequest<AuthSessionResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
