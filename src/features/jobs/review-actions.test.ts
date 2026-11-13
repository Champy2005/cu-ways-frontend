import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { getCurrentJobReview } from "@/features/jobs/api";
import { getSession } from "@/lib/auth/session";
import { ApiError } from "@/lib/api/errors";
import { serverApiRequest } from "@/lib/api/server-client";
import { checkJobReview, submitJobReview } from "./review-actions";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/api/server-client", () => ({ serverApiRequest: vi.fn() }));
vi.mock("@/features/jobs/api", () => ({ getCurrentJobReview: vi.fn() }));

const review = {
  review_id: 31,
  job_id: 12,
  rating: 4,
  comment: "Clear updates\nOn time",
  created_at: "2026-11-07T03:00:00Z",
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getSession).mockResolvedValue({
    userId: 4,
    role: "user",
    expiresAt: 4_000_000_000,
    token: "test-token",
  });
  vi.mocked(serverApiRequest).mockResolvedValue(review);
});

describe("submitJobReview", () => {
  it("posts the rating and trimmed comment once with a timeout and revalidates the job pages", async () => {
    expect(await submitJobReview(12, 4, "  Clear updates\nOn time  ")).toEqual({
      status: "submitted",
      review,
    });
    expect(serverApiRequest).toHaveBeenCalledExactlyOnceWith("/api/v1/jobs/12/reviews", {
      method: "POST",
      body: JSON.stringify({ rating: 4, comment: "Clear updates\nOn time" }),
      signal: expect.any(AbortSignal),
    });
    expect(getCurrentJobReview).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/creator/jobs/12");
    expect(revalidatePath).toHaveBeenCalledWith("/creator/jobs/12/review");
  });

  it.each([null, "", "   "])("sends an empty comment (%j) as null", async (comment) => {
    vi.mocked(serverApiRequest).mockResolvedValue({ ...review, comment: null });
    await submitJobReview(12, 5, comment);
    expect(serverApiRequest).toHaveBeenCalledWith(
      "/api/v1/jobs/12/reviews",
      expect.objectContaining({ body: JSON.stringify({ rating: 5, comment: null }) }),
    );
  });

  it.each([
    [0, 4, null],
    ["12", 4, null],
    [12, 0, null],
    [12, 6, null],
    [12, 3.5, null],
    [12, "4", null],
    [12, 4, 42],
  ])("rejects invalid input (%j, %j, %j) without calling the backend", async (job, r, c) => {
    expect((await submitJobReview(job, r, c)).status).toBe("error");
    expect(serverApiRequest).not.toHaveBeenCalled();
  });

  it("requires a session", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    expect(await submitJobReview(12, 4, null)).toMatchObject({
      status: "error",
      message: expect.stringMatching(/session expired/),
    });
    expect(serverApiRequest).not.toHaveBeenCalled();
  });

  it.each([
    [409, "job_not_completed", "unavailable"],
    [422, "validation_error", "error"],
    [401, "unauthorized", "error"],
    [403, "creator_required", "error"],
    [403, "forbidden", "error"],
    [404, "job_not_found", "error"],
    [500, "internal_error", "error"],
  ])("maps %i %s to %s without re-reading the review", async (status, code, expected) => {
    vi.mocked(serverApiRequest).mockRejectedValue(new ApiError(status, code, "backend"));
    expect((await submitJobReview(12, 4, null)).status).toBe(expected);
    expect(getCurrentJobReview).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  describe("when the job already has a review (409)", () => {
    beforeEach(() => {
      vi.mocked(serverApiRequest).mockRejectedValue(
        new ApiError(409, "review_already_exists", "backend"),
      );
    });

    it("shows the saved review read back from the backend", async () => {
      vi.mocked(getCurrentJobReview).mockResolvedValue(review);
      expect(await submitJobReview(12, 2, "Different")).toEqual({
        status: "existing",
        review,
        message: expect.stringMatching(/already has a review/),
      });
      expect(serverApiRequest).toHaveBeenCalledTimes(1);
    });

    it.each([
      ["the read fails", () => Promise.reject(new TypeError("fetch failed"))],
      ["the read returns nothing", () => Promise.resolve(null)],
    ])("reports an unconfirmed review when %s", async (_name, read) => {
      vi.mocked(getCurrentJobReview).mockImplementation(read);
      expect((await submitJobReview(12, 4, null)).status).toBe("existing_unconfirmed");
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("when the request fails in transit or times out", () => {
    it.each([
      ["a lost connection", new TypeError("fetch failed")],
      ["a timeout", new DOMException("The operation timed out.", "TimeoutError")],
    ])("shows the saved review after %s", async (_name, error) => {
      vi.mocked(serverApiRequest).mockRejectedValue(error);
      vi.mocked(getCurrentJobReview).mockResolvedValue(review);
      expect(await submitJobReview(12, 4, null)).toMatchObject({ status: "existing", review });
    });

    it("does not claim failure when no review is found yet, since it may still be saving", async () => {
      vi.mocked(serverApiRequest).mockRejectedValue(
        new DOMException("The operation timed out.", "TimeoutError"),
      );
      vi.mocked(getCurrentJobReview).mockResolvedValue(null);
      expect(await submitJobReview(12, 4, null)).toMatchObject({
        status: "unknown",
        message: expect.stringMatching(/Check the review status/),
      });
    });
  });

  it("checks the backend instead of reporting success for another job's review", async () => {
    vi.mocked(serverApiRequest).mockResolvedValue({ ...review, job_id: 99 });
    vi.mocked(getCurrentJobReview).mockResolvedValue(null);
    expect((await submitJobReview(12, 4, null)).status).toBe("unknown");
    expect(getCurrentJobReview).toHaveBeenCalledWith(12);
  });
});

describe("checkJobReview", () => {
  it("returns the saved review", async () => {
    vi.mocked(getCurrentJobReview).mockResolvedValue(review);
    expect(await checkJobReview(12)).toEqual({ status: "found", review });
    expect(revalidatePath).toHaveBeenCalledWith("/creator/jobs/12/review");
  });

  it("reports when the job has no review", async () => {
    vi.mocked(getCurrentJobReview).mockResolvedValue(null);
    expect(await checkJobReview(12)).toEqual({ status: "none" });
  });

  it.each([
    [new ApiError(401, "unauthorized", "backend"), /session expired/],
    [new ApiError(404, "job_not_found", "backend"), /no longer have access/],
    [new TypeError("fetch failed"), /could not be checked/],
  ])("maps a failed read to a message", async (error, message) => {
    vi.mocked(getCurrentJobReview).mockRejectedValue(error);
    expect(await checkJobReview(12)).toEqual({
      status: "error",
      message: expect.stringMatching(message),
    });
  });

  it("validates the job and session before reading", async () => {
    expect((await checkJobReview(0)).status).toBe("error");
    vi.mocked(getSession).mockResolvedValue(null);
    expect((await checkJobReview(12)).status).toBe("error");
    expect(getCurrentJobReview).not.toHaveBeenCalled();
  });
});
