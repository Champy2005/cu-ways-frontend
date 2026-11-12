import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { getMarketerReviews } from "@/features/marketer-discovery/api";
import { MarketerReviewsSection } from "@/features/marketer-discovery/components/marketer-reviews-section";
import type { MarketerReview, MarketerReviewHistory } from "@/features/marketer-discovery/types";
import { ApiError } from "@/lib/api/errors";

const replace = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));
vi.mock("@/features/marketer-discovery/api", () => ({ getMarketerReviews: vi.fn() }));

beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);

const BASE = "/marketers/7/verified-performance";
const review = (id: number, rating: number): MarketerReview => ({
  review_id: id,
  job_id: id + 100,
  rating,
  comment: `Comment ${id}`,
  created_at: "2026-10-01T00:00:00Z",
  reviewer_name: null,
});
const history = (
  reviews: MarketerReview[],
  average: number | null,
  extra: Partial<MarketerReviewHistory> = {},
): MarketerReviewHistory => ({
  reviews,
  average_rating: average,
  review_count: reviews.length,
  truncated: false,
  ...extra,
});

async function show(props: {
  rating?: "all" | 1 | 2 | 3 | 4 | 5;
  page?: number;
  refValue?: string;
}) {
  render(
    await MarketerReviewsSection({
      marketerID: 7,
      rating: props.rating ?? "all",
      page: props.page ?? 1,
      refValue: props.refValue ?? "",
    }),
  );
}

describe("MarketerReviewsSection", () => {
  it("shows the real average, count, per-star bars and the cards", async () => {
    vi.mocked(getMarketerReviews).mockResolvedValue(history([review(2, 5), review(1, 4)], 4.5));
    await show({});
    expect(screen.getByText("4.50")).toBeInTheDocument();
    expect(screen.getByText("2 verified reviews")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Rating distribution" })).toBeInTheDocument();
    expect(screen.getByLabelText("5 stars: 1 review")).toBeInTheDocument();
    expect(screen.getByText("Comment 2")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Review pages" })).not.toBeInTheDocument();
  });

  it("shows the no-reviews empty states and never a zero average", async () => {
    vi.mocked(getMarketerReviews).mockResolvedValue(history([], null));
    await show({});
    expect(screen.getByText("No reviews yet")).toBeInTheDocument();
    expect(screen.getByText("No ratings yet")).toBeInTheDocument();
    expect(screen.queryByText(/0\.00/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Filter by rating")).not.toBeInTheDocument();
  });

  it("keeps the true overall rating when no review has the chosen stars", async () => {
    vi.mocked(getMarketerReviews).mockResolvedValue(history([review(1, 5)], 5));
    await show({ rating: 1 });
    expect(screen.getByText("No reviews match this rating")).toBeInTheDocument();
    expect(screen.getByText("5.00")).toBeInTheDocument();
    expect(screen.getByText("0 of 1 reviews")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Show all ratings" })).toHaveAttribute("href", BASE);
  });

  it("pages the matching reviews and carries the filter and origin trail", async () => {
    const reviews = Array.from({ length: 7 }, (_, i) => review(i + 1, 5));
    vi.mocked(getMarketerReviews).mockResolvedValue(history(reviews, 5));
    await show({ rating: 5, page: 2, refValue: "from" });
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute(
      "href",
      `${BASE}?ref=from&rating=5`,
    );
    expect(screen.queryByRole("link", { name: "Next" })).not.toBeInTheDocument();
    expect(screen.getByText("Comment 7")).toBeInTheDocument();
    expect(screen.queryByText("Comment 1")).not.toBeInTheDocument();
  });

  it("applies a rating filter at once and returns to page 1", async () => {
    vi.mocked(getMarketerReviews).mockResolvedValue(history([review(1, 5), review(2, 4)], 4.5));
    await show({ page: 2, refValue: "from" });
    fireEvent.change(screen.getByLabelText("Filter by rating"), { target: { value: "4" } });
    expect(replace).toHaveBeenCalledWith(`${BASE}?ref=from&rating=4`, { scroll: false });
  });

  it("says when the history is cut at the page cap", async () => {
    vi.mocked(getMarketerReviews).mockResolvedValue(
      history([review(1, 5)], 5, { truncated: true }),
    );
    await show({});
    expect(screen.getByText("Showing the latest 1 reviews.")).toBeInTheDocument();
  });

  it("offers a retry and hides the rating when reviews cannot be read", async () => {
    vi.mocked(getMarketerReviews).mockRejectedValue(new ApiError(503, "down", "Down"));
    await show({});
    expect(screen.getByRole("alert")).toHaveTextContent("Reviews could not load");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refresh).toHaveBeenCalled();
    expect(screen.queryByText(/\/ 5/)).not.toBeInTheDocument();
  });

  it("shows only a generic notice when the profile is not available", async () => {
    vi.mocked(getMarketerReviews).mockRejectedValue(new ApiError(403, "creator_required", "x"));
    await show({});
    expect(screen.getByText("Profile unavailable")).toBeInTheDocument();
    expect(screen.queryByText("creator_required")).not.toBeInTheDocument();
  });

  it("sends an expired session to sign in", async () => {
    vi.mocked(getMarketerReviews).mockRejectedValue(new ApiError(401, "unauthorized", "x"));
    await show({});
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  });
});
