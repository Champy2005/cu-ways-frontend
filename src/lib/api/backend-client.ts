import { getBackendApiUrl } from "@/lib/env";
export { extractData, isRecord } from "@/lib/api/envelope";

export async function fetchBackend(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const baseUrl = getBackendApiUrl().replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const headers = new Headers(init.headers);

  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${baseUrl}${normalizedPath}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

export async function readBackendPayload(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}
