import { initialDemoState } from "./demo/store";
import { describe, expect, it } from "vitest";

import {
  readMarketerProfile,
  readMarketerStats,
  readPublicCatalog,
  readService,
  readServices,
} from "@/features/marketers/contracts";

const service = {
  service_id: 7,
  service_type: "Custom",
  scope_text: null,
  price: "50.00",
  created_at: "2026-09-06T00:00:00Z",
};
const profile = initialDemoState.profile;

describe("backend marketer response contracts", () => {
  it("requires numeric experience and does not coerce legacy text", () => {
    expect(readMarketerProfile(profile)).toEqual(profile);
    const { experience_years: ignoredYears, ...legacy } = profile;
    expect(ignoredYears).toBe(2);
    expect(() => readMarketerProfile({ ...legacy, experience: "Two years" })).toThrow();
    expect(() => readMarketerProfile({ ...profile, experience_years: "2" })).toThrow();
    expect(() =>
      readMarketerProfile({ ...profile, experience_years: null, experience: "Two summers" }),
    ).toThrow();
    expect(() => readMarketerProfile(null)).toThrow();
  });

  it("rejects malformed services and nondecimal prices", () => {
    expect(readService(service)).toEqual(service);
    expect(readServices([])).toEqual([]);
    expect(() => readServices(null)).toThrow();
    expect(() => readService({ ...service, price: 50 })).toThrow();
    expect(() => readService({ ...service, service_id: -1 })).toThrow();
    expect(() => readService({ ...service, created_at: null })).toThrow();
  });

  it("projects only public fields from catalog and nested services", () => {
    const result = readPublicCatalog({
      marketer: {
        user_id: 2,
        name: "Demo marketer",
        total_earnings: "5000.00",
        email: "private@example.invalid",
      },
      services: [{ ...service, total_earnings: "5000.00", private_notes: "Private" }],
      total_earnings: "5000.00",
    });
    expect(result).toEqual({
      marketer: { user_id: 2, name: "Demo marketer" },
      services: [service],
    });
    expect(JSON.stringify(result)).not.toContain("total_earnings");
    expect(() => readPublicCatalog({ marketer: null, services: [] })).toThrow();
  });

  it("distinguishes valid zero statistics from unavailable values", () => {
    const stats = { total_jobs_completed: 0, average_rating: 0, total_earnings: "0.00" };
    expect(readMarketerStats(stats)).toEqual(stats);
    expect(() => readMarketerStats({ ...stats, average_rating: null })).toThrow();
    expect(() => readMarketerStats({ ...stats, average_rating: 5.1 })).toThrow();
    expect(() => readMarketerStats({ ...stats, total_jobs_completed: 1.5 })).toThrow();
    expect(() => readMarketerStats({ ...stats, total_earnings: 0 })).toThrow();
    expect(readMarketerStats({ ...stats, total_earnings: "100000000.00" }).total_earnings).toBe(
      "100000000.00",
    );
  });
});
