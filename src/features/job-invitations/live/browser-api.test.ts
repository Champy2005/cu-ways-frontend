import { beforeEach, describe, expect, it, vi } from "vitest";
import { browserApiRequest } from "@/lib/api/browser-client";
import { reloadInvitations, respondToInvitation, submitInvitationOffer } from "./browser-api";
import { invitationEntry, receivedRequest, savedOffer } from "./test-fixtures";

vi.mock("@/lib/api/browser-client", () => ({ browserApiRequest: vi.fn() }));
beforeEach(() => vi.resetAllMocks());

describe("live browser adapter", () => {
  it("normalizes price and optional message without numeric money conversion", async () => {
    vi.mocked(browserApiRequest).mockResolvedValue(savedOffer());
    await submitInvitationOffer(7, {
      price: "00009000.5",
      deliveryDate: "2099-10-25",
      message: "   ",
    });
    expect(browserApiRequest).toHaveBeenCalledWith("/api/job-requests/7/offers", {
      method: "POST",
      body: JSON.stringify({
        offered_price: "9000.50",
        delivery_date: "2099-10-25",
        message: null,
      }),
    });
  });
  it("routes accept and decline only through the same-origin BFF", async () => {
    vi.mocked(browserApiRequest).mockResolvedValue(receivedRequest());
    await respondToInvitation(7);
    expect(browserApiRequest).toHaveBeenLastCalledWith("/api/job-requests/7/accept", {
      method: "POST",
      body: undefined,
    });
    await respondToInvitation(7, { reason: null, note: "" });
    expect(browserApiRequest).toHaveBeenLastCalledWith("/api/job-requests/7/decline", {
      method: "POST",
      body: JSON.stringify({ reason: null, note: "" }),
    });
  });
  it("reads fresh snapshots and rejects malformed refresh data", async () => {
    vi.mocked(browserApiRequest)
      .mockResolvedValueOnce([invitationEntry()])
      .mockResolvedValueOnce({});
    expect(await reloadInvitations("7")).toEqual([invitationEntry()]);
    expect(browserApiRequest).toHaveBeenCalledWith("/api/job-requests?requestId=7");
    await expect(reloadInvitations()).rejects.toMatchObject({ status: 502 });
  });
});
