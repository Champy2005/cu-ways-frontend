import { apiErrorFromResponse } from "@/lib/api/errors";
import { extractData } from "@/lib/api/envelope";

export async function browserApiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw apiErrorFromResponse(response.status, payload);
  }

  const data = extractData<T>(payload);
  if (data === undefined) {
    throw apiErrorFromResponse(response.status, payload);
  }

  return data;
}
