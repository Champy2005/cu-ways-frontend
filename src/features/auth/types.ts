import type { components } from "@/lib/api/generated/backend";

export type AuthenticatedUser = components["schemas"]["AuthenticatedUser"];
export type LoginRequest = components["schemas"]["LoginRequest"];
export type RegisterRequest = components["schemas"]["RegisterRequest"];
export type AuthSessionResponse = Omit<
  components["schemas"]["AuthResponse"]["data"],
  "access_token"
>;
