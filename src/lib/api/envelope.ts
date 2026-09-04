export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function extractData<T>(payload: unknown): T | undefined {
  if (!isRecord(payload) || !("data" in payload)) return undefined;
  return payload.data as T;
}
