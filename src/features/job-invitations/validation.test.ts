import { describe, expect, it } from "vitest";
import { isCalendarDate, normalizeOffer, validDecline, validateOffer } from "./validation";
import { formatPrice } from "./format";

const valid = { price: "8500.00", deliveryDate: "2026-10-25", message: "Campus outreach" };

describe("offer validation", () => {
  it("rejects yesterday and allows today through the deadline", () => {
    expect(
      validateOffer({ ...valid, deliveryDate: "2026-10-06" }, "2026-10-28", "2026-10-07")
        .deliveryDate,
    ).toBe("Delivery date cannot be before today.");
    expect(
      validateOffer({ ...valid, deliveryDate: "2026-10-07" }, "2026-10-28", "2026-10-07"),
    ).toEqual({});
  });
  it.each(["0", "0.00", "8500", "99999999.99", "0008.50"])("accepts price %s", (price) => {
    expect(validateOffer({ ...valid, price }, "2026-10-28", "2026-10-07")).toEqual({});
  });
  it.each(["", "-1", "1.234", "1e3", "NaN", "Infinity", "100000000", "1,000", ".5"])(
    "rejects price %s",
    (price) => {
      expect(validateOffer({ ...valid, price }, "2026-10-28", "2026-10-07").price).toBeDefined();
    },
  );
  it("keeps decimal prices exact and canonical", () => {
    expect(normalizeOffer({ ...valid, price: " 0008.5 ", message: " hi " })).toEqual({
      ...valid,
      price: "8.50",
      message: "hi",
    });
    expect(formatPrice("99999999.99")).toBe("฿99,999,999.99");
    expect(formatPrice("0")).toBe("฿0");
  });
  it.each(["", "2026-02-29", "2026-02-30", "2026-13-01", "2026-1-01", "invalid"])(
    "rejects invalid calendar date %s",
    (deliveryDate) => {
      expect(isCalendarDate(deliveryDate)).toBe(false);
      expect(
        validateOffer({ ...valid, deliveryDate }, "2026-10-28", "2026-10-07").deliveryDate,
      ).toBeDefined();
    },
  );
  it("accepts leap day and the deadline, rejects delivery after it", () => {
    expect(isCalendarDate("2028-02-29")).toBe(true);
    expect(
      validateOffer({ ...valid, deliveryDate: "2026-10-28" }, "2026-10-28", "2026-10-07"),
    ).toEqual({});
    expect(
      validateOffer({ ...valid, deliveryDate: "2026-10-29" }, "2026-10-28", "2026-10-07")
        .deliveryDate,
    ).toBeDefined();
  });
  it("allows optional messages, enforces their length", () => {
    expect(validateOffer({ ...valid, message: "" }, "2026-10-28", "2026-10-07")).toEqual({});
    expect(
      validateOffer({ ...valid, message: "a".repeat(300) }, "2026-10-28", "2026-10-07"),
    ).toEqual({});
    expect(
      validateOffer({ ...valid, message: "a".repeat(301) }, "2026-10-28", "2026-10-07").message,
    ).toBeDefined();
  });
  it("accepts optional decline details and rejects unsupported explanations", () => {
    expect(validDecline({ reason: null, note: "" })).toBe(true);
    expect(validDecline({ reason: "Schedule conflict", note: "Sorry, I’m busy." })).toBe(true);
    expect(validDecline({ reason: "Other", note: "" })).toBe(false);
    expect(validDecline({ reason: null, note: "a".repeat(301) })).toBe(false);
  });
});
