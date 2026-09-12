import { describe, expect, it } from "vitest";

import {
  formatAvailability,
  formatBaht,
  formatCount,
  formatRating,
  formatShortDate,
  formatYears,
} from "@/features/marketer-discovery/format";

describe("marketer formatting", () => {
  it("formats baht with a thousands separator", () => {
    expect(formatBaht(750)).toBe("฿750");
    expect(formatBaht(1270)).toBe("฿1,270");
  });

  it("formats a rating to one decimal, or null when unrated", () => {
    expect(formatRating(4.8)).toBe("4.8");
    expect(formatRating(5)).toBe("5.0");
    expect(formatRating(null)).toBeNull();
  });

  it("falls back to an em dash for absent counts and years", () => {
    expect(formatCount(24)).toBe("24");
    expect(formatCount(null)).toBe("—");
    expect(formatYears(1)).toBe("1 year");
    expect(formatYears(2)).toBe("2 years");
    expect(formatYears(null)).toBe("—");
  });

  it("formats short dates and returns unparseable input unchanged", () => {
    expect(formatShortDate("2025-10-12")).toBe("Oct 12");
    expect(formatShortDate("not-a-date")).toBe("not-a-date");
  });

  it("labels the availability status and appends the marketer's note", () => {
    expect(formatAvailability("limited", "Booked until mid-month")).toBe(
      "Limited · Booked until mid-month",
    );
    expect(formatAvailability("available", "   ")).toBe("Available");
  });
});
