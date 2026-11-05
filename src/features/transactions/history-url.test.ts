import { describe, expect, it } from "vitest";
import { historyHref, readHistoryQuery } from "./history-url";

describe("transaction history query", () => {
  it("trims the keyword and preserves it in pagination links", () => {
    expect(readHistoryQuery({ keyword: "  #42  ", page: "2" })).toEqual({
      keyword: "#42",
      page: 2,
    });
    expect(historyHref("creator", "#42", 2)).toBe("/creator/transactions?keyword=%2342&page=2");
    expect(historyHref("marketer", "#42")).toBe("/marketer/transactions?keyword=%2342");
  });

  it.each(["0", "1.5", "2147483648"])("normalizes an invalid page %s", (page) => {
    expect(readHistoryQuery({ page }).page).toBe(1);
  });

  it("ignores repeated page parameters", () => {
    expect(readHistoryQuery({ page: ["2", "3"] }).page).toBe(1);
  });

  it("caps the search at 100 Unicode characters", () => {
    const keyword = "😀".repeat(101);
    expect(readHistoryQuery({ keyword }).keyword).toBe("😀".repeat(100));
  });
});
