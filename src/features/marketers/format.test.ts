import { describe, expect, it } from "vitest";
import { formatBahtAmount } from "./format";

describe("baht decimal display", () => {
  it("preserves cents beyond floating-point precision", () => {
    expect(formatBahtAmount("9007199254740993.25")).toBe("9,007,199,254,740,993.25");
  });
  it("formats zero and the maximum service price", () => {
    expect(formatBahtAmount("0")).toBe("0.00");
    expect(formatBahtAmount("99999999.99")).toBe("99,999,999.99");
  });
});
