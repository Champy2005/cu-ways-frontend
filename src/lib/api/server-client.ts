import { apiErrorFromResponse } from "@/lib/api/errors";
import {
  extractData,
  fetchBackend,
  readBackendPayload,
} from "@/lib/api/backend-client";
import { getSession } from "@/lib/auth/session";

/**
 * Server-side client. It reads the HttpOnly session cookie and forwards the
 * access token to the Go backend without exposing it to browser JavaScript.
 */
export async function serverApiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const session = await getSession();
  const headers = new Headers(init.headers);
  if (session) headers.set("Authorization", `Bearer ${session.token}`);

  const response = await fetchBackend(path, { ...init, headers });
  const payload = await readBackendPayload(response);
  if (!response.ok) throw apiErrorFromResponse(response.status, payload);

  const data = extractData<T>(payload);
  if (data === undefined) throw apiErrorFromResponse(response.status, payload);
  return data;
}

export function serverApiGet<T>(path: string): Promise<T> {
  return serverApiRequest<T>(path, { method: "GET" });
}
