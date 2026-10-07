import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { JobInviteSelector } from "@/features/jobs/components/job-invite-selector";

const sendJobRequests = vi.fn();
const loadJobInviteMarketersPage = vi.fn();

vi.mock("@/features/jobs/actions", () => ({
  loadJobInviteMarketersPage: (...args: unknown[]) => loadJobInviteMarketersPage(...args),
  sendJobRequests: (...args: unknown[]) => sendJobRequests(...args),
}));

const marketers = [
  {
    marketer_id: 11,
    display_name: "Mali S.",
    headline: "Data Collection",
    average_rating: 4.8,
    rating_count: 12,
  },
  {
    marketer_id: 12,
    display_name: "Anan K.",
    headline: "Survey Distribution",
    average_rating: null,
    rating_count: 0,
  },
];

afterEach(() => {
  cleanup();
  sendJobRequests.mockReset();
  loadJobInviteMarketersPage.mockReset();
});

describe("JobInviteSelector", () => {
  it("requires a selection and reviews the chosen marketers before sending", () => {
    render(<JobInviteSelector jobId={8} marketers={marketers} totalMarketers={2} pageSize={100} />);

    expect(screen.getByRole("button", { name: "Review & Send" })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Mali S." }));
    fireEvent.click(screen.getByRole("button", { name: "Review & Send" }));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Send Direct Job Request?" })).toBeInTheDocument();
    expect(within(screen.getByRole("alertdialog")).getByText("Mali S.")).toBeInTheDocument();
  });

  it("shows a duplicate request alert when the backend rejects an active request", async () => {
    sendJobRequests.mockResolvedValue({
      status: "duplicate",
      message: "One or more selected marketers already have an active request for this job.",
    });
    render(<JobInviteSelector jobId={8} marketers={marketers} totalMarketers={2} pageSize={100} />);

    fireEvent.click(screen.getByRole("checkbox", { name: "Select Anan K." }));
    fireEvent.click(screen.getByRole("button", { name: "Review & Send" }));
    fireEvent.click(screen.getByRole("button", { name: "Send Invitation" }));

    expect(
      await screen.findByRole("heading", { name: "Active Invitation Already Exists" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/An active invitation exists for one or more selected marketers/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Review Selection" }));
    expect(screen.getByRole("checkbox", { name: "Select Anan K." })).toBeChecked();
  });

  it("shows success after sending and clears the submitted selection", async () => {
    sendJobRequests.mockResolvedValue({ status: "success", createdCount: 1 });
    render(<JobInviteSelector jobId={8} marketers={marketers} totalMarketers={2} pageSize={100} />);

    fireEvent.click(screen.getByRole("checkbox", { name: "Select Mali S." }));
    fireEvent.click(screen.getByRole("button", { name: "Review & Send" }));
    fireEvent.click(screen.getByRole("button", { name: "Send Invitation" }));

    expect(await screen.findByText("Request sent to 1 marketer.")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Select Mali S." })).not.toBeChecked();
  });

  it("searches marketers across pages with the backend keyword search", async () => {
    const matchingMarketer = {
      marketer_id: 24,
      display_name: "Prawit M.",
      headline: "Field Research",
      average_rating: 4.5,
      rating_count: 5,
    };
    loadJobInviteMarketersPage.mockResolvedValue({
      status: "success",
      items: [matchingMarketer],
      page: 1,
      pageSize: 100,
      total: 1,
      keyword: "field research",
    });
    render(<JobInviteSelector jobId={8} marketers={marketers} totalMarketers={2} pageSize={100} />);

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search marketers by name, bio, or service" }),
      {
        target: { value: "field research" },
      },
    );

    expect(await screen.findByRole("checkbox", { name: "Select Prawit M." })).toBeInTheDocument();
    expect(loadJobInviteMarketersPage).toHaveBeenCalledWith(1, "field research");
    expect(screen.queryByRole("checkbox", { name: "Select Mali S." })).not.toBeInTheDocument();
  });

  it("keeps selected marketers while paging through the full list", async () => {
    const finalPageMarketer = {
      marketer_id: 113,
      display_name: "Chai N.",
      headline: "Participant Recruitment",
      average_rating: 4.5,
      rating_count: 3,
    };
    loadJobInviteMarketersPage.mockResolvedValue({
      status: "success",
      items: [finalPageMarketer],
      page: 2,
      pageSize: 100,
      total: 101,
      keyword: "",
    });
    sendJobRequests.mockResolvedValue({ status: "success", createdCount: 2 });
    render(
      <JobInviteSelector jobId={8} marketers={marketers} totalMarketers={101} pageSize={100} />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Select Mali S." }));
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));

    expect(await screen.findByRole("checkbox", { name: "Select Chai N." })).toBeInTheDocument();
    expect(screen.getByText(/Page 2 of 2/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Chai N." }));
    fireEvent.click(screen.getByRole("button", { name: "Review & Send" }));

    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText("Mali S.")).toBeInTheDocument();
    expect(within(dialog).getByText("Chai N.")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Send Invitation" }));

    await waitFor(() => expect(sendJobRequests).toHaveBeenCalledWith(8, [11, 113]));
  });
});
