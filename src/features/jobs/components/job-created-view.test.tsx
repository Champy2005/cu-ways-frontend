import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { JobCreatedView } from "@/features/jobs/components/job-created-view";

afterEach(cleanup);

const statusSubtitles = [
  { status: "Pending", subtitle: "Awaiting offers for this job" },
  { status: "Accepted", subtitle: "Offer accepted for this job" },
  { status: "In Progress", subtitle: "Work is currently in progress" },
  { status: "Completed", subtitle: "Job completed" },
  { status: "Cancelled", subtitle: "Job cancelled" },
] as const;

describe("JobCreatedView status subtitle", () => {
  it.each(statusSubtitles)("shows the $status subtitle", ({ status, subtitle }) => {
    render(
      <JobCreatedView
        job={{
          id: 41,
          createdAt: "2026-10-01T10:00:00Z",
          title: "Campus campaign",
          compensation: "฿8,500 fixed",
          deadline: "2026-10-28",
          surveyCount: 2,
          status,
        }}
        onEdit={() => undefined}
      />,
    );

    expect(screen.getByText(subtitle)).toBeInTheDocument();
    expect(screen.getByText(status)).toBeInTheDocument();
    if (status !== "Accepted") {
      expect(screen.queryByText("Offer accepted for this job")).not.toBeInTheDocument();
    }
  });
});

it.each([0, 2])("prioritizes the next action with %i pending offers", (count) => {
  render(
    <JobCreatedView
      job={{
        id: 41,
        createdAt: "2026-10-01T10:00:00Z",
        title: "Campaign",
        compensation: "THB 100",
        deadline: "2026-10-28",
        surveyCount: 1,
        status: "Pending",
        pendingOfferCount: count,
      }}
      onEdit={() => undefined}
    />,
  );
  expect(screen.getByRole("link", { name: "Invite marketers" })).toHaveClass(
    count ? "mk-secondary-button" : "mk-primary-button",
  );
  expect(screen.getByRole("link", { name: "View offers" })).toHaveClass(
    count ? "mk-primary-button" : "mk-secondary-button",
  );
});
