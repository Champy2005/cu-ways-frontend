import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CreatorOffersJobPicker } from "@/features/jobs/components/creator-offers-job-picker";

afterEach(cleanup);

describe("CreatorOffersJobPicker", () => {
  it("shows owned jobs with survey names, statuses, and links to their offers routes", () => {
    render(
      <CreatorOffersJobPicker
        state={{
          status: "success",
          items: [
            {
              job_id: 17,
              job_status: "Pending",
              created_at: "2026-10-01T10:00:00Z",
              surveys: [{ survey_id: 41, title: "Campus mobility" }],
            },
          ],
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Your active jobs" })).toBeInTheDocument();
    expect(screen.getByText("Job #17")).toBeInTheDocument();
    expect(screen.getByText("Campus mobility")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Compare offers for job 17, Pending" }),
    ).toHaveAttribute("href", "/creator/jobs/17/offers");
  });

  it("shows an empty state when no jobs exist", () => {
    render(<CreatorOffersJobPicker state={{ status: "success", items: [] }} />);

    expect(screen.getByText("No jobs available")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to Creator workspace" })).toHaveAttribute(
      "href",
      "/creator/dashboard",
    );
  });

  it("shows load error notice when state has error", () => {
    render(
      <CreatorOffersJobPicker
        state={{ status: "error", message: "Failed to connect to backend server" }}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Failed to connect to backend server");
    expect(screen.getByRole("link", { name: "Return to Creator workspace" })).toHaveAttribute(
      "href",
      "/creator/dashboard",
    );
  });
});
