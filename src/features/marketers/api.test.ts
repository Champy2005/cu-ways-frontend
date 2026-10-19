import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMyProfile, getMyServices, getMyStats, getPublicCatalog } from "./api";
import { serverApiGet } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { initialDemoState } from "./demo/store";
vi.mock("@/lib/api/server-client", () => ({ serverApiGet: vi.fn() }));
beforeEach(() => vi.resetAllMocks());
describe("marketer server queries", () => {
  it("uses published owner endpoints and preserves an empty service list", async () => {
    vi.mocked(serverApiGet).mockResolvedValueOnce(initialDemoState.profile);
    expect(await getMyProfile()).toEqual(initialDemoState.profile);
    expect(serverApiGet).toHaveBeenLastCalledWith("/api/v1/me/marketer-profile");
    vi.mocked(serverApiGet).mockResolvedValueOnce([]);
    expect(await getMyServices()).toEqual([]);
    expect(serverApiGet).toHaveBeenLastCalledWith("/api/v1/me/services");
  });
  it.each([401, 403, 404, 503])("preserves backend failure %i", async (status) => {
    const error = new ApiError(status, "marketer_profile_not_found", "Cannot load profile");
    vi.mocked(serverApiGet).mockRejectedValueOnce(error);
    await expect(getMyProfile()).rejects.toBe(error);
  });
  it("uses the published private statistics endpoint", async () => {
    vi.mocked(serverApiGet).mockResolvedValueOnce({
      total_completed_jobs: 3,
      average_rating: 4.5,
      total_earnings: "1250.00",
    });
    await expect(getMyStats()).resolves.toEqual({
      total_jobs_completed: 3,
      average_rating: 4.5,
      total_earnings: "1250.00",
    });
    expect(serverApiGet).toHaveBeenLastCalledWith("/api/v1/me/statistics");
  });
  it("does not request a public catalog endpoint that does not exist", async () => {
    await expect(getPublicCatalog(2)).rejects.toMatchObject({ code: "feature_unavailable" });
    await expect(getPublicCatalog(-1)).rejects.toMatchObject({ status: 404 });
    expect(serverApiGet).not.toHaveBeenCalled();
  });
});
