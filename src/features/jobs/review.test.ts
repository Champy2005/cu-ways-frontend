import { describe, expect, it } from "vitest";
import { isSavedReview, isStarRating, normalizeComment, ratingLabel } from "./review";

const review = {
  review_id: 31,
  job_id: 12,
  rating: 4,
  comment: null,
  created_at: "2026-11-07T03:00:00Z",
};

describe("review helpers", () => {
  it("accepts only whole ratings from 1 to 5", () => {
    expect([1, 2, 3, 4, 5].every(isStarRating)).toBe(true);
    for (const value of [0, 6, 2.5, "3", null, undefined, Number.NaN]) {
      expect(isStarRating(value)).toBe(false);
    }
  });

  it("states the rating in words", () => {
    expect(ratingLabel(1)).toBe("1 out of 5 star");
    expect(ratingLabel(4)).toBe("4 out of 5 stars");
  });

  it("trims the comment but keeps its line breaks, and sends an empty one as null", () => {
    expect(normalizeComment("  Line one\n\nLine two  ")).toBe("Line one\n\nLine two");
    expect(normalizeComment(" \n\t ")).toBeNull();
    expect(normalizeComment("")).toBeNull();
  });

  it("validates a saved review for this job, including legacy 0-star ratings", () => {
    expect(isSavedReview(review, 12)).toBe(true);
    expect(isSavedReview({ ...review, rating: 0, comment: "Old" }, 12)).toBe(true);
    for (const bad of [
      null,
      "review",
      { ...review, job_id: 13 },
      { ...review, review_id: 0 },
      { ...review, rating: 6 },
      { ...review, rating: 3.5 },
      { ...review, comment: 7 },
      { ...review, created_at: "yesterday" },
    ]) {
      expect(isSavedReview(bad, 12)).toBe(false);
    }
  });
});
