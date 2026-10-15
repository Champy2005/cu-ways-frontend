import { describe, expect, it } from "vitest";

import {
  EMPTY_REGISTRATION,
  accountStepErrors,
  contactStepErrors,
  experienceStepErrors,
  loginValidationMessage,
  normalizeRegisterInput,
  registerValidationMessage,
  registrationPayload,
  validateLoginInput,
  validateRegisterInput,
  type RegistrationFields,
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

describe("sign-up wizard steps", () => {
  const filled: RegistrationFields = {
    ...EMPTY_REGISTRATION,
    first_name: "Jane",
    last_name: "Doe",
    email: "jane@example.com",
    password: "strong-password",
    password_confirmation: "strong-password",
    role: "creator",
    accept_terms: true,
    accept_privacy: true,
    phone: "081-234-5678",
  };

  it("requires every step-1 field, a role and both consents", () => {
    expect(accountStepErrors(EMPTY_REGISTRATION)).toEqual({
      first_name: "First name is required.",
      last_name: "Last name is required.",
      email: "Email is required.",
      password: "Password must be 8–128 characters.",
      password_confirmation: "Confirm your password.",
      role: "Choose a role.",
      accept_terms: "Accept the Terms of Service to continue.",
      accept_privacy: "Accept the Privacy Policy to continue.",
    });
    expect(accountStepErrors(filled)).toEqual({});
  });

  it("uses the design's wording for an invalid email and mismatched passwords", () => {
    const errors = accountStepErrors({
      ...filled,
      email: "janeexample.com",
      password_confirmation: "different-password",
    });
    expect(errors.email).toBe("Enter a valid email.");
    expect(errors.password_confirmation).toBe("Passwords don’t match.");
  });

  it("requires a phone, accepting the xxx-xxx-xxxx format", () => {
    expect(contactStepErrors({ ...filled, phone: "" }).phone).toBe("Phone number is required.");
    expect(contactStepErrors({ ...filled, phone: "081 234 5678" })).toEqual({});
    for (const phone of ["08x-234", "081-234-567", "081-234-56789"]) {
      expect(contactStepErrors({ ...filled, phone }).phone).toBe("Phone number must be 10 digits");
    }
    expect(contactStepErrors({ ...filled, line_id: "x".repeat(51) }).line_id).toBe(
      "Enter a valid Line ID.",
    );
  });

  it("accepts 0-80 whole years of experience, or none", () => {
    for (const years of ["", "0", "3", "80"]) {
      expect(experienceStepErrors({ ...filled, experience_years: years })).toEqual({});
    }
    for (const years of ["81", "2.5", "-1", "three"]) {
      expect(experienceStepErrors({ ...filled, experience_years: years }).experience_years).toBe(
        "Enter a whole number from 0 to 80.",
      );
    }
  });

  it("sends a creator without a marketer profile and strips phone formatting", () => {
    const payload = registrationPayload({ ...filled, line_id: "  " });
    expect(payload).toEqual({
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "0812345678",
      password: "strong-password",
      line_id: null,
    });
    expect(validateRegisterInput(payload)).toBe(true);
  });

  it("sends a marketer's profile, omitting blank years", () => {
    const marketer = {
      ...filled,
      role: "marketer" as const,
      bio: " Recruiter ",
      availability_text: "Weekends",
    };
    expect(registrationPayload({ ...marketer, experience_years: "3" }).marketer_profile).toEqual({
      bio: "Recruiter",
      availability_text: "Weekends",
      experience_years: 3,
    });
    expect(registrationPayload(marketer).marketer_profile).toEqual({
      bio: "Recruiter",
      availability_text: "Weekends",
    });
  });

  it("guards the marketer profile in the server route", () => {
    const payload = registrationPayload({ ...filled, role: "marketer", experience_years: "3" });
    expect(validateRegisterInput(payload)).toBe(true);
    expect(validateRegisterInput({ ...payload, marketer_profile: { experience_years: 81 } })).toBe(
      false,
    );
    expect(validateRegisterInput({ ...payload, marketer_profile: { experience_years: 2.5 } })).toBe(
      false,
    );
    expect(validateRegisterInput({ ...payload, marketer_profile: "marketer" })).toBe(false);
  });
});
