import { describe, expect, it } from "vitest";

import {
  contactValidationMessage,
  formatPhone,
  normalizeContactUpdate,
  phoneValidationMessage,
  validateContactUpdate,
} from "@/features/users/schemas";

describe("user contact validation", () => {
  it("strips phone formatting and turns a blank LINE ID into null", () => {
    expect(normalizeContactUpdate({ phone: " 088-888 8989 ", line_id: " cuways " })).toEqual({
      phone: "0888888989",
      line_id: "cuways",
    });
    expect(normalizeContactUpdate({ phone: "0888888989", line_id: "  " }).line_id).toBeNull();
  });

  it("requires a 10-digit phone, worded as in the design", () => {
    expect(phoneValidationMessage("  ")).toBe("Phone number is required.");
    expect(phoneValidationMessage("088-88")).toBe("Phone number must be 10 digits");
    expect(phoneValidationMessage("088-888-89899")).toBe("Phone number must be 10 digits");
    expect(phoneValidationMessage("088-888-8989")).toBeNull();
    expect(contactValidationMessage({ phone: "0888888989", line_id: "x".repeat(51) })).toBe(
      "LINE ID must be 50 characters or fewer.",
    );
  });

  it("accepts only the exact contact update shape at the server route", () => {
    expect(validateContactUpdate({ phone: "0812345678", line_id: null })).toBe(true);
    expect(validateContactUpdate({ phone: "081234567", line_id: null })).toBe(false);
    expect(validateContactUpdate({ phone: null, line_id: "cuways" })).toBe(false);
    expect(validateContactUpdate({ phone: "0812345678", line_id: null, role: "admin" })).toBe(
      false,
    );
  });

  it("formats a stored phone as xxx-xxx-xxxx", () => {
    expect(formatPhone("0888888989")).toBe("088-888-8989");
    expect(formatPhone(null)).toBe("");
  });
});
