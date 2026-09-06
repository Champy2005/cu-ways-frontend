import { getFrontendOrigin } from "@/lib/env";

function normalizeOrigin(value: string): string | null {
  try {
    const origin = new URL(value).origin;
    return origin === "null" ? null : origin;
  } catch {
    return null;
  }
}

/**
 * Auth BFF endpoints are browser-facing and require an exact configured
 * Origin. This prevents another site from causing a victim's browser to
 * receive a session for the attacker's account (login CSRF).
 */
export function isAllowedFrontendOrigin(origin: string | null): boolean {
  if (!origin) return false;

  const configuredOrigin = normalizeOrigin(getFrontendOrigin());
  const requestOrigin = normalizeOrigin(origin);
  return configuredOrigin !== null && requestOrigin === configuredOrigin;
}
