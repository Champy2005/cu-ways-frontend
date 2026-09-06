import { redirect } from "next/navigation";

import { getSession, type Session } from "@/lib/auth/session";

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireSession();
  if (session.role !== "admin") redirect("/dashboard");
  return session;
}
