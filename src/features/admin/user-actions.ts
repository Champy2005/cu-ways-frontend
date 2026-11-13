"use server";

import { ApiError, getDisplayError } from "@/lib/api/errors";
import { getSession } from "@/lib/auth/session";
import { serverApiRequest } from "@/lib/api/server-client";

export async function deactivateUser(id: number) {
  const session = await getSession();
  if (
    session?.role !== "admin" ||
    session.userId === id ||
    !Number.isInteger(id) ||
    id < 1 ||
    id > 2_147_483_647
  )
    return "This account cannot be deactivated from your session.";

  try {
    await serverApiRequest(`/api/v1/users/${id}`, { method: "DELETE" });
    return null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    return getDisplayError(error);
  }
}
