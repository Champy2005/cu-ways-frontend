import { describe, expect, it } from "vitest";

import {
  toBackendSearchParams,
  toMarketer,
  toMarketerSummary,
} from "@/features/marketer-discovery/mapping";
import { EMPTY_MARKETER_QUERY } from "@/features/marketer-discovery/schemas";
import type { MarketerSearchItem } from "@/features/marketer-discovery/types";

const item: MarketerSearchItem = {
  profile: {
    user_id: 5,
    name: "Kittipong Rattanakul",
    email: "kitti@example.com",
    phone: "0810000002",
    line_id: null,
    bio: "Data collection lead.",
    experience_years: 6,
    availability_status: "limited",
    availability_text: "Two projects at a time",
    expertise: [
      { slug: "data-collection", name: "Data Collection" },
      { slug: "quantitative-analysis", name: "Quantitative Analysis" },
    ],
    campuses: [{ slug: "cu-main-campus", name: "CU Main Campus" }],
    created_at: "2026-09-01T00:00:00Z",
  },
  lowest_matching_service_price: "2200.00",
  average_rating: 4.5,
  review_count: 4,
  services: [
    {
      service_id: 11,
      service_type: "Older package",
      scope_text: null,
      price: "3500.00",
      created_at: "2026-09-02T10:00:00Z",
      updated_at: "2026-09-02T10:00:00Z",
    },
    {
      service_id: 12,
      service_type: "Newest package",
      scope_text: "Field team",
      price: "2200.00",
      created_at: "2026-09-05T10:00:00Z",
      updated_at: "2026-09-05T10:00:00Z",
    },
  ],
};

describe("backend search params", () => {
  it("sends only the page size for an empty query", () => {
    expect(toBackendSearchParams(EMPTY_MARKETER_QUERY).toString()).toBe("page_size=100");
  });

  it("repeats multi-value keys instead of comma-joining them", () => {
    const params = toBackendSearchParams({
      ...EMPTY_MARKETER_QUERY,
      expertise: ["data-collection", "report-preparation"],
      campus: ["cu-main-campus"],
    });
    expect(params.getAll("expertise")).toEqual(["data-collection", "report-preparation"]);
    expect(params.getAll("campus")).toEqual(["cu-main-campus"]);
  });

  it("renames every filter to the backend's parameter name", () => {
    const params = toBackendSearchParams({
      ...EMPTY_MARKETER_QUERY,
      experience: 3,
      minPrice: 500,
      maxPrice: 3000,
      availability: "available",
      sort: "rating_asc",
    });
    expect(params.get("min_experience_years")).toBe("3");
    expect(params.get("min_price")).toBe("500");
    expect(params.get("max_price")).toBe("3000");
    expect(params.get("availability_status")).toBe("available");
    expect(params.get("sort")).toBe("rating_asc");
  });

  it("never sends the keyword, which the backend does not support", () => {
    expect(toBackendSearchParams({ ...EMPTY_MARKETER_QUERY, q: "food" }).has("q")).toBe(false);
  });
});

describe("search item mapping", () => {
  it("maps the fields a discovery card renders", () => {
    expect(toMarketerSummary(item)).toEqual({
      marketer_id: 5,
      display_name: "Kittipong Rattanakul",
      headline: "Data Collection · Quantitative Analysis",
      is_verified: false,
      average_rating: 4.5,
      rating_count: 4,
    });
  });

  it("keeps a missing rating as null so 'No ratings yet' shows", () => {
    expect(toMarketerSummary({ ...item, average_rating: null }).average_rating).toBeNull();
    expect(toMarketerSummary({ ...item, average_rating: undefined }).average_rating).toBeNull();
  });

  it("falls back to a generic headline when no expertise is listed", () => {
    const bare = { ...item, profile: { ...item.profile, expertise: [] } };
    expect(toMarketerSummary(bare).headline).toBe("Survey marketer");
  });

  it("lists services newest first with numeric prices and plain dates", () => {
    const packages = toMarketer(item).service_packages;
    expect(packages.map((pkg) => pkg.title)).toEqual(["Newest package", "Older package"]);
    expect(packages[0]).toEqual({
      package_id: 12,
      title: "Newest package",
      price_thb: 2200,
      published_at: "2026-09-05",
    });
  });

  it("carries real profile data and leaves unsupported fields empty", () => {
    const marketer = toMarketer(item);
    expect(marketer.availability_status).toBe("limited");
    expect(marketer.expertise).toEqual(["Data Collection", "Quantitative Analysis"]);
    expect(marketer.campuses).toEqual(["CU Main Campus"]);
    expect(marketer.experience).toBe(
      "6 years of experience in Data Collection, Quantitative Analysis.",
    );
    expect(marketer.performance.completed_jobs).toBeNull();
    expect(marketer.performance.rating_count).toBe(4);
    expect(marketer.reviews).toEqual([]);
  });
});
