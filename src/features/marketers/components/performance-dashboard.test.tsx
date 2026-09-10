import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PerformanceDashboard } from "@/features/marketers/components/performance-dashboard";
import type { MarketerProfile } from "@/features/marketers/types";

const profile: MarketerProfile = {
  user_id: 5,
  name: "Nila Example",
  bio: null,
  experience_years: null,
  availability_text: null,
};

afterEach(cleanup);

describe("PerformanceDashboard", () => {
  it("displays supplied owner metrics in baht without recalculating totals from recent jobs", () => {
    render(
      <PerformanceDashboard
        profile={profile}
        stats={{ total_jobs_completed: 24, average_rating: 4.8, total_earnings: "12400.00" }}
        recentJobs={[
          {
            id: 1,
            title: "Campus food survey",
            date: "Sep 4",
            status: "Completed",
            price: "250.00",
          },
        ]}
      />,
    );

    expect(screen.getByText("Nila Example")).toBeInTheDocument();
    expect(screen.getByText("12,400.00")).toBeInTheDocument();
    expect(screen.getByText("24")).toBeInTheDocument();
    expect(screen.getByText("4.80")).toBeInTheDocument();
    expect(screen.getByText("Only visible to you")).toBeInTheDocument();
    expect(screen.getByText("Campus food survey")).toBeInTheDocument();
    expect(screen.getByText("฿250.00")).toBeInTheDocument();
  });

  it("shows zero statistics and explains the no-ratings default", () => {
    render(
      <PerformanceDashboard
        profile={profile}
        stats={{ total_jobs_completed: 0, average_rating: 0, total_earnings: "0.00" }}
      />,
    );
    expect(screen.getByText("No ratings yet.")).toBeInTheDocument();
    expect(screen.getAllByText("0.00")).toHaveLength(2);
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.queryByText("Performance data is unavailable.")).not.toBeInTheDocument();
  });

  it("keeps unavailable statistics distinct from zero and shows the honest recent-jobs integration state", () => {
    render(
      <PerformanceDashboard profile={profile} stats={null} statsError="Please try again later." />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Performance data is unavailable.");
    expect(screen.getByText("Please try again later.")).toBeInTheDocument();
    expect(screen.queryByText("0.00")).not.toBeInTheDocument();
    expect(screen.getByText("Recent jobs are not available yet.")).toBeInTheDocument();
    expect(
      screen.getByText("Your job history will appear here when it is connected."),
    ).toBeInTheDocument();
  });
});
