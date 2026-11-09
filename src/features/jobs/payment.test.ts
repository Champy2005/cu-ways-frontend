import { describe, expect, it } from "vitest";
import { formatSatang, isPaymentMethod, toSatang, validatePaymentForm } from "./payment";

const ACCEPTED = 250_050; // ฿2,500.50

describe("toSatang", () => {
  it.each([
    ["2500.50", 250_050],
    ["2500.5", 250_050],
    ["2500", 250_000],
    [" 1500.00 ", 150_000],
    ["0.01", 1],
    ["99999999.99", 9_999_999_999],
  ])("parses %s", (value, expected) => {
    expect(toSatang(value)).toBe(expected);
  });

  it.each(["", "abc", "-5", "1.234", "1,500", "1e3", ".5", "123456789", "12."])(
    "rejects %j",
    (value) => {
      expect(toSatang(value)).toBeNull();
    },
  );
});

describe("validatePaymentForm", () => {
  it("accepts a chosen method with the exact accepted price in any decimal form", () => {
    expect(validatePaymentForm({ method: "PromptPay", amount: "2500.50" }, ACCEPTED)).toEqual({});
    expect(validatePaymentForm({ method: "Credit Card", amount: "1500" }, 150_000)).toEqual({});
    expect(validatePaymentForm({ method: "Bank Transfer", amount: "1500.00" }, 150_000)).toEqual(
      {},
    );
  });

  it("requires a supported method", () => {
    expect(validatePaymentForm({ method: "", amount: "2500.50" }, ACCEPTED).method).toBe(
      "Choose a payment method.",
    );
    expect(validatePaymentForm({ method: "Cash", amount: "2500.50" }, ACCEPTED).method).toBe(
      "Choose a payment method.",
    );
  });

  it("requires an amount", () => {
    expect(validatePaymentForm({ method: "PromptPay", amount: "   " }, ACCEPTED).amount).toBe(
      "Enter the payment amount.",
    );
  });

  it.each(["abc", "-2500.50", "0", "0.00", "2500.505"])(
    "rejects malformed, zero or negative amount %j",
    (amount) => {
      expect(validatePaymentForm({ method: "PromptPay", amount }, ACCEPTED).amount).toBe(
        "Enter a positive amount in THB with up to two decimal places.",
      );
    },
  );

  it.each(["2500.49", "2500", "25005"])("rejects mismatched amount %s", (amount) => {
    expect(validatePaymentForm({ method: "PromptPay", amount }, ACCEPTED).amount).toBe(
      "The amount must be exactly ฿2,500.50, the accepted offer price.",
    );
  });

  it("reports both fields at once", () => {
    expect(Object.keys(validatePaymentForm({ method: "", amount: "" }, ACCEPTED))).toEqual([
      "method",
      "amount",
    ]);
  });
});

describe("helpers", () => {
  it("formats satang with two decimals", () => {
    expect(formatSatang(150_000)).toBe("฿1,500.00");
  });

  it("recognises only the three backend methods", () => {
    expect(isPaymentMethod("PromptPay")).toBe(true);
    expect(isPaymentMethod("promptpay")).toBe(false);
    expect(isPaymentMethod(1)).toBe(false);
  });
});
