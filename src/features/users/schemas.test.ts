import { describe, expect, it } from "vitest";

import {
  contactValidationMessage,
  normalizeContactUpdate,
  validateContactUpdate,
} from "@/features/users/schemas";

describe("user contact validation", () => {
  it("normalizes whitespace-only optional contacts to null", () => {
    expect(normalizeContactUpdate({ phone: "  ", line_id: " cuways " })).toEqual({
      phone: null,
      line_id: "cuways",
    });
  });

  it("accepts the exact contact update shape", () => {
    expect(validateContactUpdate({ phone: "0812345678", line_id: null })).toBe(true);
    expect(validateContactUpdate({ phone: null, line_id: "cuways" })).toBe(false);
    expect(contactValidationMessage({ phone: "  ", line_id: null })).toBe(
      "Phone number is required.",
    );
    expect(validateContactUpdate({ phone: null, line_id: null, role: "admin" })).toBe(false);
  });

  it("returns a useful message when a contact value is too long", () => {
    expect(contactValidationMessage({ phone: "1".repeat(21), line_id: null })).toBe(
      "Phone must be 20 characters or fewer.",
    );
  });
});
