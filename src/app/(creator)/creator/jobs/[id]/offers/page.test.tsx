import { cleanup, render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";
import { afterEach, describe, expect, it, vi } from "vitest";

import CompareOffersPage from "@/app/(creator)/creator/jobs/[id]/offers/page";
import { loadJobOffersInitialData } from "@/features/jobs/api";
import { ApiError } from "@/lib/api/errors";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/features/jobs/api", () => ({
  loadJobOffersInitialData: vi.fn(),
}));

afterEach(cleanup);

describe("CompareOffersPage", () => {
  it("triggers notFound for invalid or negative job IDs", async () => {
    await expect(CompareOffersPage({ params: Promise.resolve({ id: "abc" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(notFound).toHaveBeenCalled();

    await expect(CompareOffersPage({ params: Promise.resolve({ id: "-5" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });

  it("renders job unavailable message when job is not found or forbidden", async () => {
    vi.mocked(loadJobOffersInitialData).mockRejectedValue(
      new ApiError(404, "job_not_found", "job was not found"),
    );

    const page = await CompareOffersPage({
      params: Promise.resolve({ id: "99" }),
    });
    render(page);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("This job is not available")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Creator workspace" })).toHaveAttribute(
      "href",
      "/creator/dashboard",
    );
  });

  it("renders page header and offers comparison component when job data loads successfully", async () => {
    vi.mocked(loadJobOffersInitialData).mockResolvedValue({
      job: {
        job_id: 15,
        job_status: "Pending",
        created_at: "2026-10-01T10:00:00Z",
        surveys: [{ survey_id: 101, title: "Consumer Habits Survey" }],
      },
      offers: {
        status: "success",
        items: [
          {
            offer_id: 201,
            job_id: 15,
            job_request_id: null,
            marketer_id: 88,
            offered_price: "4500.00",
            delivery_date: "2026-11-10T00:00:00Z",
            message: "Excited to work on this survey!",
            offer_status: "Pending",
            created_at: "2026-10-18T10:00:00Z",
            marketer: {
              user_id: 88,
              name: "Ploy Researcher",
              email: "ploy@example.com",
              phone: "089-999-9999",
              line_id: "ploy_mkt",
              bio: "Researcher bio",
              experience_years: 4,
              availability_status: "Available",
              availability_text: "Full-time",
              expertise: [{ id: 1, name: "Consumer Research" }],
              campuses: [{ id: 2, name: "CU Main" }],
              created_at: "2026-01-01T00:00:00Z",
            },
            rating: {
              average_rating: 4.9,
              review_count: 14,
              completed_jobs: 16,
              is_rated: true,
            },
          },
        ],
      },
    });

    const page = await CompareOffersPage({
      params: Promise.resolve({ id: "15" }),
    });
    render(page);

    expect(screen.getByRole("heading", { name: "Compare Job Offers" })).toBeInTheDocument();
    expect(screen.getByText("Job #15 · Consumer Habits Survey")).toBeInTheDocument();
    expect(screen.getAllByText("Pending").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("link", { name: "Back to dashboard" })).toHaveAttribute(
      "href",
      "/creator/dashboard",
    );
    expect(screen.getByRole("link", { name: "Invite marketers" })).toHaveAttribute(
      "href",
      "/creator/jobs/15/invite",
    );
    expect(screen.getByText("Ploy Researcher")).toBeInTheDocument();
    expect(screen.getByText("฿4,500")).toBeInTheDocument();
  });
});
