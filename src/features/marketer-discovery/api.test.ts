import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMarketer, getMarketerReviews } from "./api";
import { serverApiGet } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import type { MarketerReviewItem, MarketerReviewsPage } from "./types";
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

describe("marketer review history", () => {
  const item = (id: number, rating = 5, comment: string | null = "Good"): MarketerReviewItem => ({
    review_id: id,
    job_id: id + 100,
    rating,
    comment,
    created_at: "2026-10-01T00:00:00Z",
    reviewer_name: "Narin C.",
  });
  const page = (
    items: MarketerReviewItem[],
    total: number,
    average: number | null = 4.5,
  ): MarketerReviewsPage => ({
    items,
    average_rating: average,
    review_count: total,
    page: 1,
    page_size: 50,
    total,
  });

  it("reads one page with the largest page size and keeps the whole-set aggregates", async () => {
    vi.mocked(serverApiGet).mockResolvedValue(page([item(2), item(1, 4, "  ")], 2));
    const result = await getMarketerReviews(7);
    expect(serverApiGet).toHaveBeenCalledExactlyOnceWith(
      "/api/v1/marketers/7/reviews?page=1&page_size=50",
    );
    expect(result).toMatchObject({ average_rating: 4.5, review_count: 2, truncated: false });
    expect(result.reviews.map((review) => review.review_id)).toEqual([2, 1]);
    expect(result.reviews[1]?.comment).toBeNull();
    expect(result.reviews[0]?.reviewer_name).toBe("Narin C.");
  });

  it("reads every page in order and drops a review repeated across pages", async () => {
    vi.mocked(serverApiGet).mockImplementation(async (path) => {
      const number = Number(new URL(path, "http://x").searchParams.get("page"));
      const start = (number - 1) * 50;
      const ids = Array.from({ length: number === 3 ? 20 : 50 }, (_, i) => 120 - start - i);
      return page(
        number === 2 ? [item(70), ...ids.map((id) => item(id))] : ids.map((id) => item(id)),
        120,
      );
    });
    const result = await getMarketerReviews(7);
    expect(serverApiGet).toHaveBeenCalledTimes(3);
    expect(result.reviews).toHaveLength(120);
    expect(new Set(result.reviews.map((review) => review.review_id)).size).toBe(120);
    expect(result.truncated).toBe(false);
  });

  it("stops at the page cap and says the history is cut", async () => {
    vi.mocked(serverApiGet).mockImplementation(async () => page([item(1)], 5000));
    const result = await getMarketerReviews(7);
    expect(serverApiGet).toHaveBeenCalledTimes(20);
    expect(result.truncated).toBe(true);
  });

  it("keeps an unrated marketer unrated instead of inventing zero", async () => {
    vi.mocked(serverApiGet).mockResolvedValue(page([], 0, null));
    expect(await getMarketerReviews(7)).toEqual({
      reviews: [],
      average_rating: null,
      review_count: 0,
      truncated: false,
    });
  });

  it("rejects the whole read when any page fails", async () => {
    const failure = new ApiError(503, "unavailable", "Unavailable");
    vi.mocked(serverApiGet)
      .mockResolvedValueOnce(page([item(1)], 120))
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce(page([item(2)], 120));
    await expect(getMarketerReviews(7)).rejects.toBe(failure);
  });

  it("trims reviewer names and treats a blank name as absent", async () => {
    vi.mocked(serverApiGet).mockResolvedValue(
      page(
        [
          { ...item(2), reviewer_name: "  Narin C. " },
          { ...item(1), reviewer_name: "  " },
        ],
        2,
      ),
    );
    expect((await getMarketerReviews(7)).reviews.map((review) => review.reviewer_name)).toEqual([
      "Narin C.",
      null,
    ]);
  });
});
