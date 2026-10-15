import { describe, expect, it } from "vitest";
import { initialState, respond, submitOffer, withdrawOffer } from "./transitions";
import { DEMO_NOW } from "./fixtures";
import { decodeState } from "./storage";

const input = { price: "0", deliveryDate: "2026-10-28", message: "" };

describe("invitation workflow", () => {
  it("accepts, submits one offer, and makes withdrawal final without mutating fixtures", () => {
    const accepted = respond(initialState, "request-041");
    expect(accepted.invitations[0]).toMatchObject({ status: "Accepted", respondedAt: DEMO_NOW });
    const submitted = submitOffer(accepted, "request-041", input);
    expect(submitted.offers.at(-1)).toMatchObject({
      price: "0.00",
      status: "Pending",
      requestId: "request-041",
    });
    const withdrawn = withdrawOffer(submitted, "request-041");
    expect(withdrawn.offers.at(-1)).toMatchObject({ status: "Withdrawn", withdrawnAt: DEMO_NOW });
    expect(() => submitOffer(withdrawn, "request-041", input)).toThrow("Only one offer");
    expect(() => withdrawOffer(withdrawn, "request-041")).toThrow("Only a pending");
    expect(initialState.invitations[0].status).toBe("Pending");
  });
  it("persists optional decline explanations and timestamps", () => {
    const state = respond(initialState, "request-052", {
      reason: "Fully booked",
      note: " Next month is better. ",
    });
    expect(state.invitations[1]).toMatchObject({
      status: "Declined",
      declineReason: "Fully booked",
      declineNote: "Next month is better.",
      respondedAt: DEMO_NOW,
    });
    expect(() => respond(state, "request-052")).toThrow("no longer pending");
  });
  it.each(["request-063", "request-085", "request-096"])(
    "rejects a second response to %s",
    (id) => {
      expect(() => respond(initialState, id)).toThrow("no longer pending");
    },
  );
  it.each(["request-041", "request-085", "request-096"])(
    "requires an accepted request for %s",
    (id) => {
      expect(() => submitOffer(initialState, id, input)).toThrow("Accept this invitation");
    },
  );
  it("rejects missing requests, duplicates, invalid declines, and invalid offers", () => {
    expect(() => respond(initialState, "missing")).toThrow("could not be found");
    expect(() => submitOffer(initialState, "request-074", input)).toThrow("already exists");
    expect(() => respond(initialState, "request-041", { reason: "Invalid", note: "" })).toThrow(
      "Check your decline",
    );
    expect(() => submitOffer(initialState, "request-063", { ...input, price: "-1" })).toThrow(
      "Enter a price",
    );
    expect(() => withdrawOffer(initialState, "missing")).toThrow("Only a pending");
  });
});

describe("stored preview data", () => {
  it("round trips edits while keeping fixture content authoritative", () => {
    const state = submitOffer(respond(initialState, "request-041"), "request-041", input);
    const modified = {
      ...state,
      invitations: state.invitations.map((entry) => ({ ...entry, creator: "Tampered name" })),
    };
    expect(decodeState(JSON.stringify(modified))).toEqual(state);
  });
  it.each([
    null,
    "broken",
    "{}",
    '{"version":2}',
    JSON.stringify({ ...initialState, offers: [...initialState.offers, ...initialState.offers] }),
  ])("safely resets invalid storage", (raw) => {
    expect(decodeState(raw)).toBe(initialState);
  });
  it("rejects incomplete requests and offers with invalid dates or associations", () => {
    expect(decodeState(JSON.stringify({ ...initialState, invitations: [] }))).toBe(initialState);
    for (const patch of [
      { deliveryDate: "2026-02-30" },
      { requestId: "request-041" },
      { price: "-1" },
      { status: "Withdrawn", withdrawnAt: null },
    ]) {
      expect(
        decodeState(
          JSON.stringify({ ...initialState, offers: [{ ...initialState.offers[0], ...patch }] }),
        ),
      ).toBe(initialState);
    }
  });
});
