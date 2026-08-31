import type {
  AuthSessionData,
  AuthenticatedUser,
  LoginRequest,
  RegisterRequest,
} from "@/lib/api/generated/backend";

export type { AuthenticatedUser, LoginRequest, RegisterRequest };
export type AuthSessionResponse = AuthSessionData;
