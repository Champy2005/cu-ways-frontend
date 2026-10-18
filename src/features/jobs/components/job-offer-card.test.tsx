import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
    expect(screen.getByText("• 3 years")).toBeInTheDocument();
    expect(screen.getByText("฿2,500")).toBeInTheDocument();
    expect(screen.getByText("Nov 15, 2026")).toBeInTheDocument();
    expect(
      screen.getByText('"I have conducted campus surveys with 500+ participants before."'),
    ).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("4.8")).toBeInTheDocument();
    expect(screen.getByText("(12 reviews • 15 completed)")).toBeInTheDocument();
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

  it("expands essential marketer details on click and links to the public profile", () => {
    render(<JobOfferCard comparison={baseComparison} />);

    // Initially collapsed
    expect(screen.queryByTestId("expanded-details-101")).not.toBeInTheDocument();

    const expandButton = screen.getByRole("button", {
      name: /view marketer details/i,
    });
    expect(expandButton).toHaveAttribute("aria-expanded", "false");

    // Click to expand
    fireEvent.click(expandButton);

    expect(screen.getByTestId("expanded-details-101")).toBeInTheDocument();
    expect(expandButton).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText(
        "Experienced field researcher and marketer specializing in university demographics.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("available · Available for full-time survey distribution"),
    ).toBeInTheDocument();
    expect(screen.getByText("Data Collection")).toBeInTheDocument();
    expect(screen.getByText("Field Marketing")).toBeInTheDocument();
    expect(screen.getByText("Chulalongkorn University")).toBeInTheDocument();
    expect(screen.getByText("Thammasat University")).toBeInTheDocument();

    // Check link to full profile
    const profileLink = screen.getByRole("link", { name: /view full profile/i });
    expect(profileLink).toHaveAttribute("href", "/marketers/201");

    // Click to collapse
    fireEvent.click(screen.getByRole("button", { name: /hide marketer details/i }));
    expect(screen.queryByTestId("expanded-details-101")).not.toBeInTheDocument();
  });
});
