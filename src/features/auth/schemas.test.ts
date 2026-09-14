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

  it("rejects a blank phone after normalization", () => {
    const normalized = normalizeRegisterInput({
      ...validRegistration,
      phone: "   ",
      line_id: "",
    });

    expect(normalized).toMatchObject({ phone: null, line_id: null });
    expect(validateRegisterInput(normalized)).toBe(false);
    expect(registerValidationMessage(normalized)).toContain("Phone");
  });
});
