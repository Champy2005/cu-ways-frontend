import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { CreatorJobPicker } from "@/features/jobs/components/creator-job-picker";

const router = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CreatorJobPicker", () => {
  it("shows owned jobs with survey names, statuses, and links to their invite routes", () => {
    render(
      <CreatorJobPicker
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

    expect(screen.getByRole("heading", { name: "Your jobs" })).toBeInTheDocument();
    expect(screen.getByText("Job #17")).toBeInTheDocument();
    expect(screen.getByText("Campus mobility")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Invite marketers to job 17, Pending" }),
    ).toHaveAttribute("href", "/creator/jobs/17/invite");
    expect(screen.queryByLabelText("Job ID")).not.toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
  });

  it("shows an honest empty state without job creation controls", () => {
    render(<CreatorJobPicker state={{ status: "success", items: [] }} />);

    expect(screen.getByText("No jobs are available to invite")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /create job/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
  });

  it("shows a load error with a retry that refreshes server data and a useful return route", () => {
    render(<CreatorJobPicker state={{ status: "error", message: "Your session expired." }} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Your session expired.");
    expect(screen.getByRole("link", { name: "Return to Creator workspace" })).toHaveAttribute(
      "href",
      "/creator/dashboard",
    );
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(router.refresh).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Reload your jobs" }));
    expect(router.refresh).toHaveBeenCalledOnce();
  });
});
