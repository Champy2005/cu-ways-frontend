import { describe, expect, it } from "vitest";

import {
  findMockMarketer,
  MOCK_MARKETERS,
  selectMockMarketers,
} from "@/features/marketers/mock-data";
import { EMPTY_MARKETER_QUERY } from "@/features/marketers/schemas";

// These assertions guard the preconditions of the two required UI states. If a
// fixture edit breaks one, the corresponding state becomes unreachable in the app.
describe("marketer fixtures", () => {
  it("returns every marketer when no keyword is given", () => {
    expect(selectMockMarketers(EMPTY_MARKETER_QUERY).total).toBe(MOCK_MARKETERS.length);
  });

  it("returns nothing for a keyword that matches no marketer", () => {
    const result = selectMockMarketers({ ...EMPTY_MARKETER_QUERY, q: "zzzznotamarketer" });
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("matches on display name and on headline, case-insensitively", () => {
    expect(selectMockMarketers({ ...EMPTY_MARKETER_QUERY, q: "SPOTIFY" }).total).toBe(1);
    expect(selectMockMarketers({ ...EMPTY_MARKETER_QUERY, q: "designer" }).total).toBe(1);
  });

  it("includes a marketer with no ratings so the empty rating state is reachable", () => {
    const unrated = MOCK_MARKETERS.filter(
      (marketer) => marketer.average_rating === null && marketer.rating_count === 0,
    );
    expect(unrated.length).toBeGreaterThan(0);
    expect(unrated[0]?.reviews).toEqual([]);
    expect(unrated[0]?.performance.average_rating).toBeNull();
  });

  it("includes a marketer with several service packages", () => {
    expect(MOCK_MARKETERS.some((marketer) => marketer.service_packages.length > 1)).toBe(true);
  });

  it("orders by rating high to low, unrated last", () => {
    const items = selectMockMarketers({ ...EMPTY_MARKETER_QUERY, sort: "rating_desc" }).items;
    const rated = items.filter((m) => m.average_rating !== null).map((m) => m.average_rating);

    expect(rated).toEqual([...rated].sort((a, b) => (b ?? 0) - (a ?? 0)));
    expect(items.at(-1)?.average_rating).toBeNull();
  });

  it("orders by rating low to high, still keeping unrated last", () => {
    const items = selectMockMarketers({ ...EMPTY_MARKETER_QUERY, sort: "rating_asc" }).items;
    const rated = items.filter((m) => m.average_rating !== null).map((m) => m.average_rating);

    expect(rated).toEqual([...rated].sort((a, b) => (a ?? 0) - (b ?? 0)));
    // Unrated must not lead "low to high" — that would read as a bad score.
    expect(items[0]?.average_rating).not.toBeNull();
    expect(items.at(-1)?.average_rating).toBeNull();
  });

  it("leaves the order untouched when no sort is applied", () => {
    const ids = selectMockMarketers(EMPTY_MARKETER_QUERY).items.map((m) => m.marketer_id);
    expect(ids).toEqual(MOCK_MARKETERS.map((m) => m.marketer_id));
  });

  it("sorts within a keyword result set without changing the match count", () => {
    const base = selectMockMarketers({ ...EMPTY_MARKETER_QUERY, q: "e" });
    const sorted = selectMockMarketers({ ...EMPTY_MARKETER_QUERY, q: "e", sort: "rating_desc" });

    expect(sorted.total).toBe(base.total);
    expect([...sorted.items].map((m) => m.marketer_id).sort()).toEqual(
      [...base.items].map((m) => m.marketer_id).sort(),
    );
  });

  it("looks a marketer up by id and returns null when missing", () => {
    expect(findMockMarketer(1)?.marketer_id).toBe(1);
    expect(findMockMarketer(9999)).toBeNull();
  });
});
