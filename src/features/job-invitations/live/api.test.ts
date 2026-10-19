import { beforeEach, describe, expect, it, vi } from "vitest";
import { serverApiGet } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { getInvitations, getMarketerOffers } from "./api";
import { receivedRequest, savedOffer } from "./test-fixtures";

vi.mock("@/lib/api/server-client", () => ({ serverApiGet: vi.fn() }));
beforeEach(() => vi.resetAllMocks());

describe("live invitation server reads", () => {
  it("keeps withdrawn history alongside replacement offers, newest first", async () => {
    vi.mocked(serverApiGet)
      .mockResolvedValueOnce([receivedRequest()])
      .mockResolvedValueOnce([savedOffer(), { ...savedOffer("Withdrawn"), offer_id: 4 }]);
    const snapshot = await getMarketerOffers();
    expect(snapshot.offers.map((item) => item.offer.offer_id)).toEqual([5, 4]);
    expect(snapshot.offersUnavailable).toBe(false);
  });

  it("reports partial history failures and propagates authorization errors", async () => {
    vi.mocked(serverApiGet)
      .mockResolvedValueOnce([receivedRequest()])
      .mockRejectedValueOnce(new Error("offline"));
    expect(await getMarketerOffers()).toEqual({ offers: [], offersUnavailable: true });
    vi.mocked(serverApiGet)
      .mockResolvedValueOnce([receivedRequest()])
      .mockRejectedValueOnce(new ApiError(403, "forbidden", "Forbidden"));
    await expect(getMarketerOffers()).rejects.toMatchObject({ status: 403 });
  });

  it("loads only relevant offer lists and chooses the newest saved offer", async () => {
    vi.mocked(serverApiGet)
      .mockResolvedValueOnce([
        receivedRequest(),
        { ...receivedRequest("Pending"), job_request_id: 8 },
      ])
      .mockResolvedValueOnce([savedOffer(), { ...savedOffer("Withdrawn"), offer_id: 4 }]);
    const entries = await getInvitations();
    expect(entries[0].offer?.offer_id).toBe(5);
    expect(entries[1].offer).toBeNull();
    expect(serverApiGet).toHaveBeenCalledTimes(2);
  });
  it("distinguishes an empty offer list from a failed lookup", async () => {
    vi.mocked(serverApiGet)
      .mockResolvedValueOnce([receivedRequest()])
      .mockRejectedValueOnce(new Error("offline"));
    expect((await getInvitations())[0]).toMatchObject({ offer: null, offersUnavailable: true });
    vi.mocked(serverApiGet).mockResolvedValueOnce([receivedRequest()]).mockResolvedValueOnce([]);
    expect((await getInvitations())[0]).toMatchObject({ offer: null, offersUnavailable: false });
  });
  it("does not hide authorization failures or missing invitations", async () => {
    vi.mocked(serverApiGet)
      .mockResolvedValueOnce([receivedRequest()])
      .mockRejectedValueOnce(new ApiError(401, "unauthorized", "expired"));
    await expect(getInvitations()).rejects.toMatchObject({ status: 401 });
    vi.mocked(serverApiGet).mockResolvedValueOnce([receivedRequest()]);
    await expect(getInvitations("99")).rejects.toMatchObject({ status: 404 });
  });
});
