export type SessionRole = "user" | "admin";

export interface SessionClaims {
  userId: number;
  role: SessionRole;
  expiresAt: number;
}

/**
 * Decodes claims for UI routing only. The backend remains the authority that
 * verifies the JWT signature and authorization on every protected request.
 */
export function getSessionClaims(token: string): SessionClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as Record<
      string,
      unknown
    >;
    const userId = Number(payload.sub);
    const expiresAt = Number(payload.exp);
    const role = payload.role;

    if (
      !Number.isSafeInteger(userId) ||
      userId < 1 ||
      !Number.isSafeInteger(expiresAt) ||
      expiresAt <= Math.floor(Date.now() / 1000) ||
      (role !== "user" && role !== "admin")
    ) {
      return null;
    }

    return { userId, role, expiresAt };
  } catch {
    return null;
  }
}
