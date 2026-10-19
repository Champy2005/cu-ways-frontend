import { describe, expect, it } from "vitest";
import { formatOfferPrice } from "./format";

describe("offer prices", () => {
  it.each([
    ["2500.00", "฿2,500"],
    ["3500.50", "฿3,500.50"],
    ["0.00", "฿0"],
    ["0.01", "฿0.01"],
    ["99999999.99", "฿99,999,999.99"],
  ])("preserves the value of %s", (value, expected) => {
    expect(formatOfferPrice(value)).toBe(expected);
  });
});
