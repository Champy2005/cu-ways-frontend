import type { components } from "@/lib/api/generated/backend";
import type { SessionRole } from "@/lib/auth/token";

export type AuthenticatedUser = components["schemas"]["AuthenticatedUser"];
export type LoginRequest = components["schemas"]["LoginRequest"];
export type RegisterRequest = components["schemas"]["RegisterRequest"];
export type AuthSessionResponse = Omit<
  components["schemas"]["AuthResponse"]["data"],
  "access_token"
> & { role: SessionRole | null };
