import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMarketer } from "./api";
import { serverApiGet } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
vi.mock("@/lib/api/server-client", () => ({ serverApiGet: vi.fn() }));
beforeEach(() => vi.resetAllMocks());

describe("marketer detail lookup", () => {
  it("uses the direct ID endpoint even for marketers beyond the first search page", async () => {
    vi.mocked(serverApiGet).mockResolvedValue({
      profile: {
        user_id: 150,
        name: "Later marketer",
        expertise: [],
        campuses: [],
        experience_years: 2,
      },
      services: [],
      total_completed_jobs: 3,
      review_count: 2,
      average_rating: 4.5,
    });
    const result = await getMarketer(150);
    expect(serverApiGet).toHaveBeenCalledExactlyOnceWith("/api/v1/marketers/150");
    expect(result?.performance).toMatchObject({
      completed_jobs: 3,
      rating_count: 2,
      average_rating: 4.5,
    });
  });
  it("only treats a missing profile as not found", async () => {
    vi.mocked(serverApiGet).mockRejectedValueOnce(new ApiError(404, "not_found", "Missing"));
    expect(await getMarketer(150)).toBeNull();
    const unavailable = new ApiError(503, "unavailable", "Unavailable");
    vi.mocked(serverApiGet).mockRejectedValueOnce(unavailable);
    await expect(getMarketer(150)).rejects.toBe(unavailable);
  });
});
