import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { JobOfferCard } from "@/features/jobs/components/job-offer-card";
import type { JobOfferComparison } from "@/features/jobs/types";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const baseComparison: JobOfferComparison = {
  offer_id: 101,
  job_id: 12,
  job_request_id: 5,
  marketer_id: 201,
  offered_price: "2500.00",
  delivery_date: "2026-11-15",
  message: "I have conducted campus surveys with 500+ participants before.",
  offer_status: "Pending",
  created_at: "2026-10-18T10:00:00Z",
  marketer: {
    user_id: 201,
    name: "Somchai Marketing",
    email: "somchai@example.com",
    phone: "081-234-5678",
    line_id: "somchai_mkt",
    bio: "Experienced field researcher and marketer specializing in university demographics.",
    experience_years: 3,
    availability_status: "available",
    availability_text: "Available for full-time survey distribution",
    expertise: [
      { slug: "data-collection", name: "Data Collection" },
      { slug: "field-marketing", name: "Field Marketing" },
    ],
    campuses: [
      { slug: "chulalongkorn-university", name: "Chulalongkorn University" },
      { slug: "thammasat-university", name: "Thammasat University" },
    ],
    created_at: "2026-01-15T00:00:00Z",
  },
  rating: {
    average_rating: 4.8,
    review_count: 12,
    completed_jobs: 15,
    is_rated: true,
  },
};

describe("JobOfferCard", () => {
  it.each(["UTC", "America/Los_Angeles", "Pacific/Kiritimati"])(
    "preserves delivery dates and shows Bangkok submission dates in a %s runtime",
    (runtimeTimeZone) => {
      // Simulate the server/browser default timezone, keeping explicit zones authoritative.
      vi.spyOn(Date.prototype, "toLocaleDateString").mockImplementation(function (
        this: Date,
        locales,
        options,
      ) {
        return new Intl.DateTimeFormat(locales, {
          timeZone: runtimeTimeZone,
          ...options,
        }).format(this);
      });

      render(
        <JobOfferCard comparison={{ ...baseComparison, created_at: "2026-10-18T23:30:00Z" }} />,
      );

      expect(screen.getByText("Nov 15, 2026")).toBeInTheDocument();
      expect(screen.getByText("Submitted on Oct 19, 2026")).toBeInTheDocument();
    },
  );

  it("renders marketer profile, offered price, delivery date, message, and status", () => {
    render(<JobOfferCard comparison={baseComparison} />);

    expect(screen.getByRole("heading", { name: "Somchai Marketing" })).toBeInTheDocument();
    expect(screen.getByText("· 3 years")).toBeInTheDocument();
    expect(screen.getByText("฿2,500")).toBeInTheDocument();
    expect(screen.getByText("Nov 15, 2026")).toBeInTheDocument();
    expect(
      screen.getByText("I have conducted campus surveys with 500+ participants before."),
    ).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("4.8")).toBeInTheDocument();
    expect(screen.getByText("(12 reviews)")).toBeInTheDocument();
  });

  it("handles unrated state for marketers without reviews", () => {
    const unratedComparison: JobOfferComparison = {
      ...baseComparison,
      offer_id: 102,
      marketer: {
        ...baseComparison.marketer,
        name: "New Marketer",
      },
      rating: {
        average_rating: null,
        review_count: 0,
        completed_jobs: 0,
        is_rated: false,
      },
    };

    render(<JobOfferCard comparison={unratedComparison} />);

    expect(screen.getByRole("heading", { name: "New Marketer" })).toBeInTheDocument();
    expect(screen.getByTestId("unrated-badge")).toHaveTextContent("No ratings yet");
    expect(screen.queryByText(/0\.0/)).not.toBeInTheDocument();
    expect(screen.queryByText(/0 reviews/)).not.toBeInTheDocument();
  });

  it("opens full marketer details in a dialog and returns to the compact card", async () => {
    render(<JobOfferCard comparison={baseComparison} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: /view details/i });
    fireEvent.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "Somchai Marketing" });
    expect(within(dialog).getByText(baseComparison.marketer.bio)).toBeInTheDocument();
    expect(within(dialog).getByText("available").parentElement).toHaveTextContent(
      "available · Available for full-time survey distribution",
    );
    expect(within(dialog).getByText("Data Collection, Field Marketing")).toBeInTheDocument();
    expect(
      within(dialog).getByText("Chulalongkorn University, Thammasat University"),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("4.8 / 5")).toBeInTheDocument();
    expect(within(dialog).getByText("15")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Close details" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
