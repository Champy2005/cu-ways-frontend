import type { SessionRole } from "@/lib/auth/token";

export function canManageUsers(role: SessionRole): boolean {
  return role === "admin";
}
