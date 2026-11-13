import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { MarketerReviewCard } from "@/features/marketer-discovery/components/marketer-review-card";
import type { MarketerReview } from "@/features/marketer-discovery/types";

afterEach(cleanup);

const base: MarketerReview = {
  review_id: 1,
  job_id: 41,
  rating: 4,
  comment: "Arrived as agreed.",
  created_at: "2026-10-01T00:00:00Z",
  reviewer_name: null,
};

function renderCard(overrides: Partial<MarketerReview> = {}) {
  return render(
    <ul>
      <MarketerReviewCard review={{ ...base, ...overrides }} />
    </ul>,
  );
}

describe("MarketerReviewCard", () => {
  it("shows rating, comment, date, linked job and the verified mark", () => {
    renderCard();
    expect(screen.getByRole("img", { name: "4 out of 5 stars" })).toBeInTheDocument();
    expect(screen.getByText("Arrived as agreed.")).toBeInTheDocument();
    expect(screen.getByText("1 Oct 2026")).toHaveAttribute("datetime", base.created_at);
    expect(screen.getByText("Job #41")).toBeInTheDocument();
    expect(screen.getByText(/review from a completed job/)).toBeInTheDocument();
  });

  it("does not invent a comment for a rating-only review", () => {
    renderCard({ comment: null });
    expect(screen.getByText("No written feedback.")).toBeInTheDocument();
    expect(screen.queryByText("Arrived as agreed.")).not.toBeInTheDocument();
  });

  it("shows the reviewer only when the backend supplies one", () => {
    const { unmount } = renderCard();
    expect(screen.queryByText("Narin C.")).not.toBeInTheDocument();
    unmount();
    renderCard({ reviewer_name: "Narin C." });
    expect(screen.getByText("Narin C.")).toBeInTheDocument();
  });

  it("keeps a short comment inline without a disclosure", () => {
    const { container } = renderCard();
    expect(container.querySelector("details")).toBeNull();
  });

  it("previews a long comment and keeps the whole text behind the disclosure", () => {
    const long = `${"Excellent delivery and clear reports. ".repeat(20)}The end.`;
    const { container } = renderCard({ comment: long });
    expect(container.querySelector("details")).not.toBeNull();
    expect(screen.getByText("Read full review")).toBeInTheDocument();
    expect(screen.getByText("Show less")).toBeInTheDocument();
    expect(container.querySelector("details p")?.textContent).toBe(long);
    expect(screen.getAllByText(/Excellent delivery/)[0]?.textContent?.endsWith("…")).toBe(true);
  });
});
