import { describe, expect, it } from "vitest";

import {
  activeFilterChips,
  buildBackHref,
  buildDiscoveryHref,
  buildMarketerHref,
  buildMarketerHrefFromRef,
  buildMarketerSubPageHref,
  EMPTY_MARKETER_QUERY,
  hasActiveFilters,
  isEmptyMarketerQuery,
  parseMarketerQuery,
  removeFilter,
  serializeMarketerQuery,
} from "@/features/marketer-discovery/schemas";
import type { MarketerQuery } from "@/features/marketer-discovery/types";

const fullQuery: MarketerQuery = {
  q: "food",
  expertise: ["devops", "designer"],
  campus: ["engineering"],
  experience: 3,
  minPrice: 550,
  maxPrice: 1270,
  from: "2025-09-06",
  to: "2025-09-28",
  sort: "rating_asc",
};

describe("marketer query parsing", () => {
  it("returns the empty query for empty input", () => {
    expect(parseMarketerQuery({})).toEqual(EMPTY_MARKETER_QUERY);
    expect(isEmptyMarketerQuery(parseMarketerQuery({}))).toBe(true);
    expect(hasActiveFilters(parseMarketerQuery({}))).toBe(false);
  });

  it("round-trips a fully populated query through the URL", () => {
    const encoded = serializeMarketerQuery(fullQuery);
    expect(parseMarketerQuery(new URLSearchParams(encoded))).toEqual(fullQuery);
  });

  it("omits defaults from the serialized query string", () => {
    expect(serializeMarketerQuery(EMPTY_MARKETER_QUERY)).toBe("");
    expect(serializeMarketerQuery({ ...EMPTY_MARKETER_QUERY, q: "food" })).toBe("q=food");
  });

  it("drops unknown slugs and de-duplicates lists", () => {
    const query = parseMarketerQuery({
      expertise: "devops,not-a-real-slug,devops",
      campus: "atlantis",
    });
    expect(query.expertise).toEqual(["devops"]);
    expect(query.campus).toEqual([]);
  });

  it("clamps out-of-range numbers instead of throwing", () => {
    expect(parseMarketerQuery({ exp: "999" }).experience).toBe(50);
    expect(parseMarketerQuery({ exp: "-3" }).experience).toBe(0);
    expect(parseMarketerQuery({ exp: "not-a-number" }).experience).toBeNull();
    expect(parseMarketerQuery({ max: "999999" }).maxPrice).toBe(5000);
  });

  it("normalizes an inverted price range and date range", () => {
    const prices = parseMarketerQuery({ min: "2000", max: "500" });
    expect([prices.minPrice, prices.maxPrice]).toEqual([500, 2000]);

    const dates = parseMarketerQuery({ from: "2025-12-01", to: "2025-01-01" });
    expect([dates.from, dates.to]).toEqual(["2025-01-01", "2025-12-01"]);
  });

  it("takes the first value when a key is repeated", () => {
    expect(parseMarketerQuery({ q: ["first", "second"] }).q).toBe("first");
  });

  it("rejects malformed dates and unknown sort options", () => {
    expect(parseMarketerQuery({ from: "06/09/2025" }).from).toBeNull();
    expect(parseMarketerQuery({ from: "2025-13-45" }).from).toBeNull();
    expect(parseMarketerQuery({ sort: "price_sideways" }).sort).toBeNull();
  });

  it("accepts both rating sort directions", () => {
    expect(parseMarketerQuery({ sort: "rating_asc" }).sort).toBe("rating_asc");
    expect(parseMarketerQuery({ sort: "rating_desc" }).sort).toBe("rating_desc");
    expect(serializeMarketerQuery({ ...EMPTY_MARKETER_QUERY, sort: "rating_desc" })).toBe(
      "sort=rating_desc",
    );
  });

  it("no longer accepts the removed minimum-rating filter", () => {
    const query = parseMarketerQuery({ rating: "4" });
    expect(query).toEqual(EMPTY_MARKETER_QUERY);
    expect(serializeMarketerQuery(query)).toBe("");
  });
});

describe("marketer filter chips", () => {
  it("produces one chip per active filter", () => {
    expect(activeFilterChips(fullQuery).map((chip) => chip.label)).toEqual([
      "DevOps",
      "Designer",
      "Engineering",
      "3+ years",
      "Price Range",
      "Availability",
      "Rating: low to high",
    ]);
  });

  it("produces no chips for a keyword-only query", () => {
    expect(activeFilterChips({ ...EMPTY_MARKETER_QUERY, q: "food" })).toEqual([]);
  });

  it("removes only the targeted filter", () => {
    const chips = activeFilterChips(fullQuery);
    const devops = chips[0];
    if (!devops) throw new Error("expected a chip");

    const next = removeFilter(fullQuery, devops);
    expect(next.expertise).toEqual(["designer"]);
    expect(next.campus).toEqual(["engineering"]);
    expect(next.q).toBe("food");
  });

  it("clears both ends of a range filter at once", () => {
    const next = removeFilter(fullQuery, { key: "minPrice", label: "Price Range" });
    expect([next.minPrice, next.maxPrice]).toEqual([null, null]);
  });
});

describe("marketer navigation hrefs", () => {
  it("builds a bare discovery href when nothing is applied", () => {
    expect(buildDiscoveryHref(EMPTY_MARKETER_QUERY)).toBe("/marketers");
    expect(buildMarketerHref(3, EMPTY_MARKETER_QUERY)).toBe("/marketers/3");
  });

  it("stashes the discovery query in the ref param", () => {
    const href = buildMarketerHref(3, { ...EMPTY_MARKETER_QUERY, q: "food" });
    expect(href).toBe("/marketers/3?ref=q%3Dfood");
  });

  it("forwards ref through sub-pages and back to the profile", () => {
    expect(buildMarketerSubPageHref(3, "service-packages", "q=food")).toBe(
      "/marketers/3/service-packages?ref=q%3Dfood",
    );
    expect(buildMarketerHrefFromRef(3, "q=food")).toBe("/marketers/3?ref=q%3Dfood");
    expect(buildMarketerHrefFromRef(3, undefined)).toBe("/marketers/3");
  });

  it("restores the discovery query from a ref", () => {
    const ref = serializeMarketerQuery(fullQuery);
    expect(buildBackHref(ref)).toBe(buildDiscoveryHref(fullQuery));
  });

  it("never lets a hostile ref escape the discovery route", () => {
    for (const hostile of [
      "//evil.example",
      "https://evil.example",
      "redirect=http://evil.example",
      "q=ok&next=//evil.example",
      ["//evil.example", "q=ok"],
    ]) {
      expect(buildBackHref(hostile).startsWith("/marketers")).toBe(true);
    }
  });
});
