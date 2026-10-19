import { describe, expect, it } from "vitest";
import { readEntries, readOffers, readReceivedRequest, readRequest } from "./contracts";
import { receivedRequest, savedOffer } from "./test-fixtures";
import {
  characterCount,
  isRequestId,
  offerErrors,
  safeExternalUrl,
  validLiveDecline,
  validOfferBody,
} from "./validation";

describe("live invitation contracts", () => {
  it("preserves nullable metadata and strips unrelated backend fields", () => {
    expect(
      readReceivedRequest({
        ...receivedRequest(),
        access_token: "not-for-browser",
        title: "fictional",
      }),
    ).toEqual(receivedRequest());
    expect(readRequest(receivedRequest())).not.toHaveProperty("job");
    expect(
      readOffers([{ ...savedOffer(), delivery_date: null, message: null }], receivedRequest())[0]
        .delivery_date,
    ).toBeNull();
  });
  it.each([
    { ...receivedRequest(), job_request_id: -1 },
    { ...receivedRequest(), request_status: "Unknown" },
    { ...receivedRequest(), request_status: ["Accepted"] },
    { ...receivedRequest(), created_at: "invalid" },
    { ...receivedRequest(), job: { ...receivedRequest().job, deadline: "invalid" } },
    { ...receivedRequest(), job: { ...receivedRequest().job, target_responses: "350" } },
  ])("rejects malformed request data", (value) => {
    expect(() => readReceivedRequest(value)).toThrow("Invitation data could not be read");
  });
  it("rejects mismatched offer ownership and invalid snapshot shapes", () => {
    expect(() =>
      readOffers([{ ...savedOffer(), offer_status: ["Pending"] }], receivedRequest()),
    ).toThrow();
    expect(() => readOffers([{ ...savedOffer(), marketer_id: 9 }], receivedRequest())).toThrow();
    expect(() => readOffers([{ ...savedOffer(), job_id: 99 }], receivedRequest())).toThrow();
    expect(() => readEntries([{ request: receivedRequest(), offer: null }])).toThrow();
    expect(() => readOffers({}, receivedRequest())).toThrow();
  });
  it("only allows HTTP(S) external links and positive int32 identifiers", () => {
    expect(safeExternalUrl("https://example.test/brief")).toBe("https://example.test/brief");
    for (const url of ["javascript:alert(1)", "data:text/html,test", "/relative", "not a URL"])
      expect(safeExternalUrl(url)).toBeNull();
    for (const id of ["0", "-1", "1e2", "2147483648", "01", "7/accept"])
      expect(isRequestId(id)).toBe(false);
    expect(isRequestId("2147483647")).toBe(true);
  });
});

describe("live form validation", () => {
  const input = { price: "0", deliveryDate: "2026-10-15", message: "" };
  it("accepts zero, the price maximum, and inclusive Bangkok calendar boundaries", () => {
    expect(offerErrors(input, "2026-10-15", null)).toEqual({});
    expect(offerErrors({ ...input, price: "99999999.99" }, "2026-10-15", "2026-10-15")).toEqual({});
    expect(offerErrors({ ...input, price: "100000000" }, "2026-10-15", null)).toHaveProperty(
      "price",
    );
    expect(offerErrors({ ...input, price: "-1" }, "2026-10-15", null)).toHaveProperty("price");
    expect(offerErrors({ ...input, price: "1.001" }, "2026-10-15", null)).toHaveProperty("price");
    expect(
      offerErrors({ ...input, deliveryDate: "2026-10-14" }, "2026-10-15", null),
    ).toHaveProperty("deliveryDate");
    expect(
      offerErrors({ ...input, deliveryDate: "2026-10-16" }, "2026-10-15", "2026-10-15"),
    ).toHaveProperty("deliveryDate");
    expect(
      offerErrors({ ...input, deliveryDate: "2026-02-30" }, "2026-10-15", null),
    ).toHaveProperty("deliveryDate");
  });
  it("counts Unicode characters like the backend and validates body allowlists", () => {
    expect(characterCount("😀".repeat(300))).toBe(300);
    expect(offerErrors({ ...input, message: "😀".repeat(300) }, "2026-10-15", null)).toEqual({});
    expect(offerErrors({ ...input, message: "😀".repeat(301) }, "2026-10-15", null)).toHaveProperty(
      "message",
    );
    expect(validLiveDecline({ reason: null, note: "😀".repeat(300) })).toBe(true);
    expect(validLiveDecline({ reason: "anything", note: "" })).toBe(false);
    expect(validLiveDecline({ reason: null, note: "a".repeat(301) })).toBe(false);
    const body = { offered_price: "0.00", delivery_date: "2026-10-15", message: null };
    expect(validOfferBody(body)).toBe(true);
    expect(validOfferBody({ ...body, marketer_id: 8 })).toBe(false);
  });
});
