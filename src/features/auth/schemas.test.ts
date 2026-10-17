import { describe, expect, it } from "vitest";

import {
  loginValidationMessage,
  normalizeRegisterInput,
  registerValidationMessage,
  validateLoginInput,
  validateRegisterInput,
} from "@/features/auth/schemas";

const validRegistration = {
  name: "CU Ways Creator",
  email: "creator@example.com",
  password: "strong-password",
  phone: "0812345678",
  line_id: "cuways.creator",
};

describe("authentication input validation", () => {
  it("accepts valid login and registration payloads", () => {
    expect(
      validateLoginInput({ email: validRegistration.email, password: validRegistration.password }),
    ).toBe(true);
    expect(validateRegisterInput(validRegistration)).toBe(true);
  });

  it("rejects malformed emails and short passwords", () => {
    expect(validateLoginInput({ email: "not-an-email", password: "short" })).toBe(false);
    expect(validateRegisterInput({ ...validRegistration, password: "short" })).toBe(false);
    expect(loginValidationMessage({ email: validRegistration.email, password: "short" })).toBe(
      "Password must be between 8 and 128 characters.",
    );
  });

  it("allows a blank phone and normalizes it to null", () => {
    const normalized = normalizeRegisterInput({
      ...validRegistration,
      phone: "   ",
      line_id: "",
    });

    expect(normalized).toMatchObject({ phone: null, line_id: null });
    expect(validateRegisterInput(normalized)).toBe(true);
    expect(registerValidationMessage(normalized)).toBeNull();
  });

  it("rejects a phone that is too long", () => {
    const tooLong = {
      ...validRegistration,
      phone: "1".repeat(21),
    };

    expect(validateRegisterInput(tooLong)).toBe(false);
    expect(registerValidationMessage(tooLong)).toContain("Phone");
  });
});
