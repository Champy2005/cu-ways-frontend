import { beforeEach, describe, expect, it, vi } from "vitest";
import { serverApiGet } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { getInvitations } from "./api";
import { receivedRequest, savedOffer } from "./test-fixtures";

vi.mock("@/lib/api/server-client", () => ({ serverApiGet: vi.fn() }));
beforeEach(() => vi.resetAllMocks());

describe("live invitation server reads", () => {
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
