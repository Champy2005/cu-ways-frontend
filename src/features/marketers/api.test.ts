import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getMyProfile,
  getMyServices,
  getMyStats,
  getPublicCatalog,
} from "@/features/marketers/api";
import { serverApiGet } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";

vi.mock("@/lib/api/server-client", () => ({ serverApiGet: vi.fn() }));

beforeEach(() => vi.resetAllMocks());

describe("marketer server queries", () => {
  it("reads the proposed owner endpoints and preserves legitimate zero/empty data", async () => {
    const profile = {
      user_id: 2,
      name: "Demo",
      bio: null,
      experience_years: null,
      availability_text: null,
    };
    vi.mocked(serverApiGet).mockResolvedValueOnce(profile);
    expect(await getMyProfile()).toEqual(profile);
    expect(serverApiGet).toHaveBeenLastCalledWith("/api/v1/marketers/me");
    vi.mocked(serverApiGet).mockResolvedValueOnce([]);
    expect(await getMyServices()).toEqual([]);
    expect(serverApiGet).toHaveBeenLastCalledWith("/api/v1/marketers/me/services");
    vi.mocked(serverApiGet).mockResolvedValueOnce({
      total_jobs_completed: 0,
      average_rating: 0,
      total_earnings: "0.00",
    });
    expect(await getMyStats()).toMatchObject({ total_jobs_completed: 0 });
    expect(serverApiGet).toHaveBeenLastCalledWith("/api/v1/marketers/me/stats");
  });

  it("preserves forbidden and missing-marketer responses", async () => {
    const forbidden = new ApiError(403, "not_marketer", "A marketer profile is required.");
    vi.mocked(serverApiGet).mockRejectedValueOnce(forbidden);
    await expect(getMyProfile()).rejects.toBe(forbidden);
    const missing = new ApiError(404, "marketer_not_found", "Marketer not found.");
    vi.mocked(serverApiGet).mockRejectedValueOnce(missing);
    await expect(getPublicCatalog(99)).rejects.toBe(missing);
  });

  it("requests only the selected viewer catalog and rejects mismatched identity", async () => {
    vi.mocked(serverApiGet).mockResolvedValueOnce({
      marketer: { user_id: 2, name: "Demo" },
      services: [],
      total_earnings: "999.00",
    });
    expect(await getPublicCatalog(2)).toEqual({
      marketer: { user_id: 2, name: "Demo" },
      services: [],
    });
    expect(serverApiGet).toHaveBeenLastCalledWith("/api/v1/marketers/2/services");
    vi.mocked(serverApiGet).mockResolvedValueOnce({
      marketer: { user_id: 3, name: "Someone else" },
      services: [],
    });
    await expect(getPublicCatalog(2)).rejects.toMatchObject({ status: 502 });
    await expect(getPublicCatalog(-1)).rejects.toMatchObject({ status: 404 });
  });
});
