export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function hasData(payload: unknown): payload is { data: unknown } {
  return isRecord(payload) && "data" in payload;
}

export function extractData<T>(payload: unknown): T | null {
  if (!hasData(payload)) return null;
  return payload.data as T;
}
