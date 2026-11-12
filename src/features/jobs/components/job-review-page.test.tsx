import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { JobReviewData } from "../api";
import type { SavedReview } from "../review";
import { checkJobReview, submitJobReview, type SubmitReviewResult } from "../review-actions";
import { testJob, testOffer } from "../testing/offer-fixtures";
import { JobReviewPage } from "./job-review-page";

vi.mock("../review-actions", () => ({ submitJobReview: vi.fn(), checkJobReview: vi.fn() }));
afterEach(cleanup);
beforeEach(() => {
  vi.resetAllMocks();
});

const saved: SavedReview = {
  review_id: 31,
  job_id: 12,
  rating: 4,
  comment: "Clear updates.\n<b>On time</b>",
  created_at: "2026-11-07T03:00:00Z",
};

function renderPage(overrides: Partial<JobReviewData> = {}) {
  return render(
    <JobReviewPage
      data={{
        job: { ...testJob, title: "Campus mobility study", job_status: "Completed" },
        acceptedOffer: { ...testOffer(), offer_status: "Accepted" },
        currentReview: null,
        ...overrides,
      }}
    />,
  );
}

function star(count: number) {
  return screen.getByRole("radio", { name: `${count} ${count === 1 ? "star" : "stars"}` });
}

function submitForm() {
  fireEvent.click(screen.getByRole("button", { name: "Review & submit" }));
}

async function confirmInDialog() {
  const dialog = await screen.findByRole("alertdialog", { name: "Submit your review?" });
  fireEvent.click(within(dialog).getByRole("button", { name: "Submit review" }));
  return dialog;
}

describe("creator review page", () => {
  it("shows the completed job and the hired Marketer with no rating preselected", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "Write a review" })).toBeInTheDocument();
    expect(screen.getByText("Your review will appear on Mali Research's profile.")).toBeVisible();
    for (const count of [1, 2, 3, 4, 5]) expect(star(count)).not.toBeChecked();
    expect(screen.getByText("Select 1 to 5 stars.")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /Comment/ })).toHaveValue("");
  });

  it("requires a rating, focuses the first star, and clears the error once chosen", () => {
    renderPage();
    submitForm();
    expect(screen.getByText("Choose a rating from 1 to 5 stars.")).toBeInTheDocument();
    expect(star(1)).toHaveFocus();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

    fireEvent.click(star(3));
    expect(screen.queryByText("Choose a rating from 1 to 5 stars.")).not.toBeInTheDocument();
    expect(screen.getByText("3 out of 5 stars")).toBeInTheDocument();
    const filled = screen
      .getAllByRole("radio")
      .map((input) => input.closest("label")?.getAttribute("data-filled"));
    expect(filled).toEqual(["true", "true", "true", "false", "false"]);
  });

  it("confirms the rating and exact comment, and Go back keeps the draft", async () => {
    renderPage();
    fireEvent.click(star(5));
    fireEvent.change(screen.getByRole("textbox", { name: /Comment/ }), {
      target: { value: "  Great work\nThanks  " },
    });
    submitForm();
    const dialog = await screen.findByRole("alertdialog", { name: "Submit your review?" });
    expect(within(dialog).getByText("Mali Research")).toBeInTheDocument();
    expect(within(dialog).getByText("5 out of 5 stars")).toBeInTheDocument();
    expect(within(dialog).getByText(/Great work/).textContent).toBe("Great work\nThanks");

    fireEvent.click(within(dialog).getByRole("button", { name: "Go back" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(submitJobReview).not.toHaveBeenCalled();
    expect(star(5)).toBeChecked();
    expect(screen.getByRole("textbox", { name: /Comment/ })).toHaveValue("  Great work\nThanks  ");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Review & submit" })).toHaveFocus(),
    );
  });

  it("says when there is no written comment", async () => {
    renderPage();
    fireEvent.click(star(2));
    submitForm();
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("No written comment.")).toBeInTheDocument();
  });

  it("submits once, then replaces the form with the saved review", async () => {
    let finish!: (result: SubmitReviewResult) => void;
    vi.mocked(submitJobReview).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    renderPage();
    fireEvent.click(star(4));
    fireEvent.change(screen.getByRole("textbox", { name: /Comment/ }), {
      target: { value: saved.comment },
    });
    submitForm();
    const dialog = await confirmInDialog();
    const submitting = await within(dialog).findByRole("button", { name: "Submitting…" });
    expect(submitting).toBeDisabled();
    fireEvent.click(submitting);
    expect(submitJobReview).toHaveBeenCalledExactlyOnceWith(12, 4, saved.comment);

    finish({ status: "submitted", review: saved });
    expect(await screen.findByRole("heading", { name: "Your review" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Review submitted" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "4 out of 5 stars" })).toBeInTheDocument();
    expect(screen.getByText("7 Nov 2026, 10:00 (Bangkok)")).toBeInTheDocument();
    // Rendered as text, never as markup.
    expect(screen.getByText(/On time/).textContent).toBe("Clear updates.\n<b>On time</b>");
    expect(document.querySelector("b")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("Thank you for your feedback.");
    expect(screen.queryByRole("button", { name: "Review & submit" })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("heading", { name: "Your review" })).toHaveFocus());
  });

  it("keeps a failed save in the dialog with the full draft so the Creator can retry", async () => {
    vi.mocked(submitJobReview)
      .mockResolvedValueOnce({ status: "error", message: "The review could not be submitted." })
      .mockResolvedValueOnce({ status: "submitted", review: saved });
    renderPage();
    fireEvent.click(star(4));
    submitForm();
    const dialog = await confirmInDialog();
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("could not be submitted");
    fireEvent.click(await within(dialog).findByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "Review submitted" })).toBeInTheDocument();
    expect(submitJobReview).toHaveBeenCalledTimes(2);
  });

  it("shows the existing review on reload, with no second form", () => {
    renderPage({ currentReview: { ...saved, comment: null } });
    expect(screen.getByRole("heading", { name: "Your review" })).toBeInTheDocument();
    expect(screen.getByText("No written comment.")).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("shows the saved review when a duplicate submit is refused", async () => {
    vi.mocked(submitJobReview).mockResolvedValue({
      status: "existing",
      review: saved,
      message: "This job already has a review, so a new one was not submitted.",
    });
    renderPage();
    fireEvent.click(star(1));
    submitForm();
    await confirmInDialog();
    expect(await screen.findByText(/a new one was not submitted/)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "4 out of 5 stars" })).toBeInTheDocument();
  });

  it("checks the review status after an unknown result and returns to the form if none", async () => {
    vi.mocked(submitJobReview).mockResolvedValue({
      status: "unknown",
      message: "We could not confirm whether the review was saved.",
    });
    vi.mocked(checkJobReview).mockResolvedValue({ status: "none" });
    renderPage();
    fireEvent.click(star(5));
    submitForm();
    await confirmInDialog();
    expect(await screen.findByRole("heading", { name: "Review status unknown" })).toBeVisible();
    fireEvent.click(await screen.findByRole("button", { name: "Check review status" }));
    expect(await screen.findByText(/No review is saved for this job yet/)).toHaveAttribute(
      "role",
      "alert",
    );
    expect(star(5)).toBeChecked();
  });

  it("lets the Creator close the dialog while submitting without a second submit", async () => {
    let finish!: (result: SubmitReviewResult) => void;
    vi.mocked(submitJobReview).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    renderPage();
    fireEvent.click(star(3));
    submitForm();
    const dialog = await confirmInDialog();
    fireEvent.click(await within(dialog).findByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(screen.getByRole("status")).toHaveTextContent("Still submitting this review");
    const button = screen.getByRole("button", { name: "Submitting…" });
    expect(button).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(button);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(submitJobReview).toHaveBeenCalledTimes(1);

    finish({ status: "submitted", review: saved });
    expect(await screen.findByRole("heading", { name: "Review submitted" })).toBeInTheDocument();
  });

  it.each([["In Progress" as const], ["Accepted" as const], ["Cancelled" as const]])(
    "explains the completion requirement for a %s job",
    (status) => {
      renderPage({ job: { ...testJob, job_status: status } });
      expect(screen.getByText("Complete the job first")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "View job details" })).toHaveAttribute(
        "href",
        "/creator/jobs/12",
      );
      expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    },
  );

  it("moves to the incomplete state if the backend says the job is no longer completed", async () => {
    vi.mocked(submitJobReview).mockResolvedValue({
      status: "unavailable",
      message: "This job is no longer completed, so it cannot be reviewed.",
    });
    renderPage();
    fireEvent.click(star(4));
    submitForm();
    await confirmInDialog();
    expect(await screen.findByText(/no longer completed/)).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });
});
