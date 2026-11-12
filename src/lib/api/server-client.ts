import { apiErrorFromResponse } from "@/lib/api/errors";
import { fetchBackend, readBackendPayload } from "@/lib/api/backend-client";
import { hasData } from "@/lib/api/envelope";
import { getSession } from "@/lib/auth/session";

/**
 * Server-side client. It reads the HttpOnly session cookie and forwards the
 * access token to the Go backend without exposing it to browser JavaScript.
 */
export async function serverApiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = await getSession();
  const headers = new Headers(init.headers);
  if (session) headers.set("Authorization", `Bearer ${session.token}`);

  const response = await fetchBackend(path, { ...init, headers });
  const payload = await readBackendPayload(response);
  if (!response.ok) throw apiErrorFromResponse(response.status, payload);

  if (!hasData(payload)) throw apiErrorFromResponse(response.status, payload);
  return payload.data as T;
}

/** `signal` lets a caller bound a read that must not hang, such as a status check. */
export function serverApiGet<T>(path: string, options: { signal?: AbortSignal } = {}): Promise<T> {
  return serverApiRequest<T>(
    path,
    options.signal ? { method: "GET", signal: options.signal } : { method: "GET" },
  );
}
