import { describe, expect, it } from "vitest";

import {
  parseProfileForm,
  parseServiceForm,
  validateProfileInput,
  validateServiceInput,
} from "@/features/marketers/schemas";

const profileForm = { bio: "", experience_years: "", availability_text: "" };
const serviceForm = { service_type: "On-Campus Distribution", scope_text: "", price: "50" };

describe("professional profile validation", () => {
  it("normalizes optional blank fields to null", () => {
    expect(parseProfileForm({ bio: "  ", experience_years: "", availability_text: "\n" })).toEqual({
      success: true,
      data: { bio: null, experience_years: null, availability_text: null },
    });
  });

  it.each(["0", "2.5", ".5", "0.25"])("accepts nonnegative years %s", (years) => {
    expect(parseProfileForm({ ...profileForm, experience_years: years })).toEqual({
      success: true,
      data: { bio: null, experience_years: Number(years), availability_text: null },
    });
  });

  it.each(["-1", "NaN", "Infinity", "two years", "1e3", "0x10", "9".repeat(310)])(
    "rejects invalid years %s",
    (years) => {
      const result = parseProfileForm({ ...profileForm, experience_years: years });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.errors.experience_years).toBeTruthy();
    },
  );

  it("trims profile text without losing internal line breaks", () => {
    const result = parseProfileForm({
      ...profileForm,
      bio: "  First line\nSecond line  ",
      availability_text: " Weekends ",
    });
    expect(result).toMatchObject({
      success: true,
      data: { bio: "First line\nSecond line", availability_text: "Weekends" },
    });
  });

  it("validates transport types and rejects caller-supplied ownership", () => {
    const input = { bio: null, experience_years: 1.5, availability_text: null };
    expect(validateProfileInput(input)).toBe(true);
    expect(validateProfileInput({ ...input, experience_years: "1.5" })).toBe(false);
    expect(validateProfileInput({ ...input, experience_years: Infinity })).toBe(false);
    expect(validateProfileInput({ ...input, user_id: 9 })).toBe(false);
    expect(validateProfileInput({ bio: null })).toBe(false);
    expect(validateProfileInput(null)).toBe(false);
  });
});

describe("service validation", () => {
  it("requires a service name and limits it to 100 characters", () => {
    for (const service_type of ["", "  ", "a".repeat(101)]) {
      const result = parseServiceForm({ ...serviceForm, service_type });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.errors.service_type).toBeTruthy();
    }
    expect(parseServiceForm({ ...serviceForm, service_type: "a".repeat(100) }).success).toBe(true);
  });

  it("supports custom names and preserves existing free-text scope exactly", () => {
    const scope_text = "  First channel\n\nTarget audience and proof  ";
    expect(
      parseServiceForm({ ...serviceForm, service_type: "  My custom package  ", scope_text }),
    ).toEqual({
      success: true,
      data: { service_type: "My custom package", scope_text, price: "50.00" },
    });
    expect(parseServiceForm({ ...serviceForm, scope_text: " \n " })).toMatchObject({
      data: { scope_text: null },
    });
  });

  it.each([
    ["0", "0.00"],
    ["0.0", "0.00"],
    ["00042.5", "42.50"],
    ["99999999.99", "99999999.99"],
  ])("accepts decimal price %s and canonicalizes to %s", (price, expected) => {
    expect(parseServiceForm({ ...serviceForm, price })).toMatchObject({
      success: true,
      data: { price: expected },
    });
  });

  it.each(["", "  ", "-1", "1e2", "NaN", "Infinity", "1.001", "100000000", "1,000", ".50", "1."])(
    "rejects invalid price %s",
    (price) => {
      const result = parseServiceForm({ ...serviceForm, price });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.errors.price).toBeTruthy();
    },
  );

  it("validates exact mutation shapes and keeps price a decimal string", () => {
    const input = { service_type: "Custom", scope_text: null, price: "0.00" };
    expect(validateServiceInput(input)).toBe(true);
    expect(validateServiceInput({ ...input, price: 0 })).toBe(false);
    expect(validateServiceInput({ ...input, user_id: 9 })).toBe(false);
    expect(validateServiceInput({ ...input, service_id: 42 })).toBe(false);
    expect(validateServiceInput([])).toBe(false);
    expect(validateServiceInput({ ...input, scope_text: 1 })).toBe(false);
  });
});
