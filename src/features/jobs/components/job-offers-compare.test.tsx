import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { JobOffersCompare } from "@/features/jobs/components/job-offers-compare";
import type { JobOfferComparison } from "@/features/jobs/types";

afterEach(cleanup);

const mockOffers: JobOfferComparison[] = [
  {
    offer_id: 1,
    job_id: 10,
    job_request_id: 101,
    marketer_id: 501,
    offered_price: "3000.00",
    delivery_date: "2026-11-20T00:00:00Z",
    message: "Offer 1 message",
    offer_status: "Pending",
    created_at: "2026-10-15T10:00:00Z",
    marketer: {
      user_id: 501,
      name: "Marketer Alpha",
      email: "alpha@example.com",
      phone: "081-111-1111",
      line_id: "alpha_line",
      bio: "Alpha bio",
      experience_years: 2,
      availability_status: "available",
      availability_text: "Available",
      expertise: [{ slug: "seo", name: "SEO" }],
      campuses: [{ slug: "chula", name: "Chula" }],
      created_at: "2026-01-01T00:00:00Z",
    },
    rating: {
      average_rating: 4.5,
      review_count: 10,
      completed_jobs: 12,
      is_rated: true,
    },
  },
  {
    offer_id: 2,
    job_id: 10,
    job_request_id: 102,
    marketer_id: 502,
    offered_price: "1500.00",
    delivery_date: "2026-11-10T00:00:00Z",
    message: "Offer 2 message",
    offer_status: "Pending",
    created_at: "2026-10-16T10:00:00Z",
    marketer: {
      user_id: 502,
      name: "Marketer Beta",
      email: "beta@example.com",
      phone: "082-222-2222",
      line_id: "beta_line",
      bio: "Beta bio",
      experience_years: 5,
      availability_status: "available",
      availability_text: "Available",
      expertise: [{ slug: "field-survey", name: "Field Survey" }],
      campuses: [{ slug: "chula", name: "Chula" }],
      created_at: "2026-01-01T00:00:00Z",
    },
    rating: {
      average_rating: 4.9,
      review_count: 25,
      completed_jobs: 30,
      is_rated: true,
    },
  },
  {
    offer_id: 3,
    job_id: 10,
    job_request_id: 103,
    marketer_id: 503,
    offered_price: "2000.00",
    delivery_date: "2026-11-25T00:00:00Z",
    message: null,
    offer_status: "Accepted",
    created_at: "2026-10-17T10:00:00Z",
    marketer: {
      user_id: 503,
      name: "Marketer Gamma",
      email: "gamma@example.com",
      phone: null,
      line_id: null,
      bio: "Gamma bio",
      experience_years: 1,
      availability_status: "available",
      availability_text: "Available",
      expertise: [],
      campuses: [],
      created_at: "2026-01-01T00:00:00Z",
    },
    rating: {
      average_rating: null,
      review_count: 0,
      completed_jobs: 0,
      is_rated: false,
    },
  },
];

describe("JobOffersCompare", () => {
  it("renders empty state with invite link when no offers are submitted", () => {
    render(<JobOffersCompare jobId={10} offers={[]} />);

    expect(screen.getByRole("heading", { name: "No offers submitted yet" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /invite marketers/i })).toHaveAttribute(
      "href",
      "/creator/jobs/10/invite",
    );
  });

  it("renders error notice when error prop is provided", () => {
    render(<JobOffersCompare jobId={10} offers={[]} error="Network error loading offers" />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Network error loading offers")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Retry" })).toHaveAttribute(
      "href",
      "/creator/jobs/10/offers",
    );
  });

  it("renders offers count and all offer cards by default sorted by price lowest first", () => {
    render(<JobOffersCompare jobId={10} offers={mockOffers} />);

    expect(screen.getByText("Showing 3 offers")).toBeInTheDocument();
    expect(screen.getByText("Marketer Alpha")).toBeInTheDocument();
    expect(screen.getByText("Marketer Beta")).toBeInTheDocument();
    expect(screen.getByText("Marketer Gamma")).toBeInTheDocument();

    // Default sort is price_asc: 1500 (Beta), 2000 (Gamma), 3000 (Alpha)
    const cards = screen.getAllByRole("article");
    expect(cards[0]).toHaveTextContent("Marketer Beta");
    expect(cards[1]).toHaveTextContent("Marketer Gamma");
    expect(cards[2]).toHaveTextContent("Marketer Alpha");
  });

  it("filters offers by status", () => {
    render(<JobOffersCompare jobId={10} offers={mockOffers} />);

    // Click Accepted tab
    fireEvent.click(screen.getByRole("tab", { name: "Accepted (1)" }));

    expect(screen.getByText("Showing 1 offer (Accepted)")).toBeInTheDocument();
    expect(screen.queryByText("Marketer Alpha")).not.toBeInTheDocument();
    expect(screen.queryByText("Marketer Beta")).not.toBeInTheDocument();
    expect(screen.getByText("Marketer Gamma")).toBeInTheDocument();

    // Click Pending tab
    fireEvent.click(screen.getByRole("tab", { name: "Pending (2)" }));

    expect(screen.getByText("Showing 2 offers (Pending)")).toBeInTheDocument();
    expect(screen.getByText("Marketer Alpha")).toBeInTheDocument();
    expect(screen.getByText("Marketer Beta")).toBeInTheDocument();
    expect(screen.queryByText("Marketer Gamma")).not.toBeInTheDocument();
  });

  it("shows empty state when no offers match status filter and allows resetting", () => {
    render(<JobOffersCompare jobId={10} offers={mockOffers} />);

    // Click Rejected tab (0 count)
    fireEvent.click(screen.getByRole("tab", { name: "Rejected (0)" }));

    expect(screen.getByText("No Rejected offers found")).toBeInTheDocument();

    // Reset filter
    fireEvent.click(screen.getByRole("button", { name: "Reset filter" }));
    expect(screen.getByText("Showing 3 offers")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "All (3)" })).toHaveFocus();
  });

  it("sorts offers by highest rating first and by highest price first", () => {
    render(<JobOffersCompare jobId={10} offers={mockOffers} />);

    const select = screen.getByLabelText("Sort by:");

    // Sort by rating_desc: Beta (4.9), Alpha (4.5), Gamma (unrated)
    fireEvent.change(select, { target: { value: "rating_desc" } });
    let cards = screen.getAllByRole("article");
    expect(cards[0]).toHaveTextContent("Marketer Beta");
    expect(cards[1]).toHaveTextContent("Marketer Alpha");
    expect(cards[2]).toHaveTextContent("Marketer Gamma");

    // Sort by price_desc: Alpha (3000), Gamma (2000), Beta (1500)
    fireEvent.change(select, { target: { value: "price_desc" } });
    cards = screen.getAllByRole("article");
    expect(cards[0]).toHaveTextContent("Marketer Alpha");
    expect(cards[1]).toHaveTextContent("Marketer Gamma");
    expect(cards[2]).toHaveTextContent("Marketer Beta");

    // Sort by delivery_earliest: Beta (Nov 10), Alpha (Nov 20), Gamma (Nov 25)
    fireEvent.change(select, { target: { value: "delivery_earliest" } });
    cards = screen.getAllByRole("article");
    expect(cards[0]).toHaveTextContent("Marketer Beta");
    expect(cards[1]).toHaveTextContent("Marketer Alpha");
    expect(cards[2]).toHaveTextContent("Marketer Gamma");
  });
});
