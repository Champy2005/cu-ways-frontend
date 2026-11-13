import { describe, expect, it } from "vitest";

import {
  REVIEW_COMMENT_LIMIT,
  REVIEW_PAGE_SIZE,
  filterReviews,
  paginateReviews,
  parseReviewParams,
  ratingDistribution,
  reviewComment,
  reviewsHref,
} from "@/features/marketer-discovery/reviews";
import type { MarketerReview } from "@/features/marketer-discovery/types";

const review = (id: number, rating: number): MarketerReview => ({
  review_id: id,
  job_id: id + 100,
  rating,
  comment: null,
  created_at: "2026-10-01T00:00:00Z",
  reviewer_name: null,
});

describe("review URL state", () => {
  it("defaults to all ratings on page 1", () => {
    expect(parseReviewParams({})).toEqual({ rating: "all", page: 1 });
  });

  it("reads a valid star filter and page, using the first repeated value", () => {
    expect(parseReviewParams({ rating: "4", page: "3" })).toEqual({ rating: 4, page: 3 });
    expect(parseReviewParams({ rating: ["2", "5"], page: ["2", "9"] })).toEqual({
      rating: 2,
      page: 2,
    });
  });

  it.each(["0", "6", "4.5", "five", ""])("ignores the invalid rating %j", (rating) => {
    expect(parseReviewParams({ rating }).rating).toBe("all");
  });

  it.each(["0", "-1", "1.5", "abc", "99999999999"])("falls back to page 1 for %j", (page) => {
    expect(parseReviewParams({ page }).page).toBe(1);
  });

  it("keeps the origin trail and drops default values from links", () => {
    expect(reviewsHref(7, { rating: "all", page: 1 }, undefined)).toBe(
      "/marketers/7/verified-performance",
    );
    expect(reviewsHref(7, { rating: 4, page: 2 }, "q=a b")).toBe(
      "/marketers/7/verified-performance?ref=q%3Da+b&rating=4&page=2",
    );
  });

  it("keeps owner review filtering and pagination in the marketer workspace", () => {
    expect(reviewsHref(7, { rating: 4, page: 2 }, "marketer-dashboard")).toBe(
      "/marketer/reviews?rating=4&page=2",
    );
  });
});

describe("review aggregates", () => {
  const all = [review(1, 5), review(2, 5), review(3, 3), review(4, 1)];

  it("counts every star from five down to one, including empty ones", () => {
    expect(ratingDistribution(all)).toEqual([
      { star: 5, count: 2 },
      { star: 4, count: 0 },
      { star: 3, count: 1 },
      { star: 2, count: 0 },
      { star: 1, count: 1 },
    ]);
  });

  it("filters to one star and keeps everything for all", () => {
    expect(filterReviews(all, 5).map((item) => item.review_id)).toEqual([1, 2]);
    expect(filterReviews(all, 2)).toEqual([]);
    expect(filterReviews(all, "all")).toBe(all);
  });

  it("pages in order and clamps a stale page into range", () => {
    const many = Array.from({ length: REVIEW_PAGE_SIZE + 2 }, (_, i) => review(i + 1, 5));
    expect(paginateReviews(many, 1).items).toHaveLength(REVIEW_PAGE_SIZE);
    expect(paginateReviews(many, 2)).toMatchObject({ page: 2, pages: 2 });
    expect(paginateReviews(many, 2).items.map((item) => item.review_id)).toEqual([6, 7]);
    expect(paginateReviews(many, 50).page).toBe(2);
    expect(paginateReviews([], 3)).toEqual({ page: 1, pages: 1, items: [] });
  });
});

describe("long comments", () => {
  it("returns a short comment whole, including exactly at the limit", () => {
    expect(reviewComment("Great work").preview).toBeNull();
    expect(reviewComment("a".repeat(REVIEW_COMMENT_LIMIT)).preview).toBeNull();
  });

  it("previews a longer one at a word boundary and keeps the full text", () => {
    const text = `${"word ".repeat(120)}end`;
    const { preview, text: full } = reviewComment(text);
    expect(full).toBe(text);
    expect(preview?.endsWith("…")).toBe(true);
    expect(preview?.endsWith(" …")).toBe(false);
    expect(text.startsWith(preview?.slice(0, -1) ?? "?")).toBe(true);
  });

  it("never splits an emoji or a combined Thai character", () => {
    const emoji = reviewComment("😀".repeat(500)).preview ?? "";
    expect(Array.from(emoji.slice(0, -1)).every((part) => part === "😀")).toBe(true);
    const thai = reviewComment("ก็".repeat(500)).preview ?? "";
    expect(thai.slice(0, -1)).toMatch(/^(ก็)+$/);
  });
});
