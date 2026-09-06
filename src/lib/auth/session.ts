import { cookies } from "next/headers";

import { getSessionClaims, type SessionClaims } from "@/lib/auth/token";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

export { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

export interface Session extends SessionClaims {
  token: string;
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const claims = getSessionClaims(token);
  if (!claims) return null;

  return { token, ...claims };
}
