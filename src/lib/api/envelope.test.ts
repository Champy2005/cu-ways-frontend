import { describe, expect, it } from "vitest";

import { extractData, hasData, isRecord } from "@/lib/api/envelope";

describe("API envelope helpers", () => {
  it("distinguishes records from null, arrays, and primitives", () => {
    expect(isRecord({ status: "success" })).toBe(true);
    expect(isRecord(null)).toBe(false);
    expect(isRecord([])).toBe(false);
    expect(isRecord("success")).toBe(false);
  });

  it("recognizes and extracts a data envelope", () => {
    const payload = { data: { user_id: 1 } };

    expect(hasData(payload)).toBe(true);
    expect(extractData<{ user_id: number }>(payload)).toEqual({ user_id: 1 });
  });

  it("returns null when data is absent", () => {
    expect(hasData({ status: "success" })).toBe(false);
    expect(extractData({ status: "success" })).toBeNull();
  });
});
