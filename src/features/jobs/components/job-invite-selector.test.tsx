import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { JobInviteSelector } from "@/features/jobs/components/job-invite-selector";

const sendJobRequests = vi.fn();
const loadJobInviteMarketersPage = vi.fn();
const loadJobSentInvitations = vi.fn();

vi.mock("@/features/jobs/actions", () => ({
  loadJobInviteMarketersPage: (...args: unknown[]) => loadJobInviteMarketersPage(...args),
  loadJobSentInvitations: (...args: unknown[]) => loadJobSentInvitations(...args),
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

function sentInvitation(
  marketerId: number,
  marketerName: string,
  requestStatus: "Pending" | "Accepted" | "Declined" | "Closed",
) {
  return {
    job_request_id: marketerId + 100,
    job_id: 8,
    marketer_id: marketerId,
    request_status: requestStatus,
    created_at: "2026-10-01T10:00:00Z",
    responded_at: requestStatus === "Pending" ? null : "2026-10-02T10:00:00Z",
    marketer_name: marketerName,
  } as const;
}

function createdRequest(marketerId: number) {
  return {
    job_request_id: marketerId + 200,
    job_id: 8,
    marketer_id: marketerId,
    request_status: "Pending" as const,
    created_at: "2026-10-03T10:00:00Z",
    responded_at: null,
  };
}

function renderSelector(
  overrides: Partial<{
    marketers: typeof marketers;
    totalMarketers: number;
    pageSize: number;
    marketersError: string;
    jobStatus: "Pending" | "Accepted" | "In Progress" | "Completed" | "Cancelled";
    sentInvitations: ReturnType<typeof sentInvitation>[];
    sentInvitationsFresh: boolean;
    sentInvitationsError: string;
  }> = {},
) {
  return render(
    <JobInviteSelector
      jobId={8}
      marketers={marketers}
      totalMarketers={2}
      pageSize={100}
      sentInvitations={[]}
      sentInvitationsFresh
      {...overrides}
    />,
  );
}

afterEach(() => {
  cleanup();
  sendJobRequests.mockReset();
  loadJobInviteMarketersPage.mockReset();
  loadJobSentInvitations.mockReset();
});

describe("JobInviteSelector", () => {
  it("requires a selection and reviews the chosen marketers before sending", () => {
    renderSelector();

    expect(screen.getByRole("button", { name: "Review & Send" })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Mali S." }));
    fireEvent.click(screen.getByRole("button", { name: "Review & Send" }));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Send Direct Job Request?" })).toBeInTheDocument();
    expect(within(screen.getByRole("alertdialog")).getByText("Mali S.")).toBeInTheDocument();
  });

  it("shows persisted named requests and blocks only Pending or Accepted marketers", () => {
    renderSelector({
      sentInvitations: [
        sentInvitation(11, "Mali S.", "Pending"),
        sentInvitation(12, "Anan K.", "Accepted"),
      ],
    });

    expect(screen.getByRole("heading", { name: "Direct Invitations" })).toBeInTheDocument();
    const directInvitations = screen.getByRole("region", { name: "Direct Invitations" });
    expect(within(directInvitations).getByText("Mali S.")).toBeInTheDocument();
    expect(within(directInvitations).getByText("Anan K.")).toBeInTheDocument();
    expect(within(directInvitations).getByText("Pending")).toBeInTheDocument();
    expect(within(directInvitations).getByText("Accepted")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Select Mali S." })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Select Anan K." })).toBeDisabled();
    expect(screen.getByText("Pending invitation")).toBeInTheDocument();
    expect(screen.getByText("Accepted invitation")).toBeInTheDocument();
  });

  it("allows declined and closed invitations to be resent", async () => {
    sendJobRequests.mockResolvedValue({
      status: "success",
      requests: [createdRequest(11), createdRequest(12)],
    });
    renderSelector({
      jobStatus: "Pending",
      sentInvitations: [
        sentInvitation(11, "Mali S.", "Declined"),
        sentInvitation(12, "Anan K.", "Closed"),
      ],
    });

    const maliCheckbox = screen.getByRole("checkbox", { name: "Select Mali S." });
    const ananCheckbox = screen.getByRole("checkbox", { name: "Select Anan K." });
    expect(maliCheckbox).toBeEnabled();
    expect(ananCheckbox).toBeEnabled();
    fireEvent.click(maliCheckbox);
    fireEvent.click(ananCheckbox);
    expect(maliCheckbox).toBeChecked();
    expect(ananCheckbox).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Review & Send" }));
    fireEvent.click(screen.getByRole("button", { name: "Send Invitation" }));

    await waitFor(() => expect(sendJobRequests).toHaveBeenCalledWith(8, [11, 12]));
    expect(await screen.findByText("Requests sent to 2 marketers.")).toBeInTheDocument();
  });

  it("shows closed empty-history guidance and disables inviting when the initial job is not pending", () => {
    renderSelector({ jobStatus: "In Progress" });

    expect(screen.getByText("Invitations are closed for this job")).toBeInTheDocument();
    const directInvitations = screen.getByRole("region", { name: "Direct Invitations" });
    expect(
      within(directInvitations).getByText("No invitations were sent for this job"),
    ).toBeInTheDocument();
    expect(
      within(directInvitations).queryByText(
        "Choose marketers below to send the first direct invitation for this job.",
      ),
    ).not.toBeInTheDocument();
    expect(
      within(directInvitations).getByText(
        "This job is no longer pending, so invitations cannot be sent.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Invite Marketers" })).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Select Mali S." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Review & Send" })).toBeDisabled();
    expect(sendJobRequests).not.toHaveBeenCalled();
  });

  it("stops further invites when the backend reports that a pending job has closed", async () => {
    sendJobRequests.mockResolvedValue({
      status: "job_not_pending",
      message: "This job is no longer pending, so no further invitations can be sent.",
    });
    renderSelector({ sentInvitations: [sentInvitation(12, "Anan K.", "Declined")] });

    fireEvent.click(screen.getByRole("checkbox", { name: "Select Mali S." }));
    fireEvent.click(screen.getByRole("button", { name: "Review & Send" }));
    fireEvent.click(screen.getByRole("button", { name: "Send Invitation" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This job is no longer pending, so no further invitations can be sent.",
    );
    const directInvitations = screen.getByRole("region", { name: "Direct Invitations" });
    expect(within(directInvitations).getByText("Anan K.")).toBeInTheDocument();
    expect(within(directInvitations).getByText("Declined")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Active Invitation Already Exists" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Invite Marketers" })).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Select Mali S." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Review & Send" })).toBeDisabled();
    expect(loadJobSentInvitations).not.toHaveBeenCalled();
    expect(sendJobRequests).toHaveBeenCalledTimes(1);
  });

  it("shows named conflicts, removes only active IDs, and retains other selected marketers", async () => {
    sendJobRequests.mockResolvedValue({
      status: "duplicate",
      refreshStatus: "success",
      message: "Active invitation exists.",
      sentInvitations: [sentInvitation(11, "Mali S.", "Pending")],
      conflictingMarketerIds: [11],
    });
    renderSelector();

    fireEvent.click(screen.getByRole("checkbox", { name: "Select Mali S." }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Anan K." }));
    fireEvent.click(screen.getByRole("button", { name: "Review & Send" }));
    fireEvent.click(screen.getByRole("button", { name: "Send Invitation" }));

    const duplicateHeading = await screen.findByRole("heading", {
      name: "Active Invitation Already Exists",
    });
    const duplicateDialog = duplicateHeading.closest<HTMLElement>('[role="alertdialog"]');
    expect(duplicateDialog).not.toBeNull();
    if (!duplicateDialog) throw new Error("Expected a duplicate invitation dialog");
    expect(within(duplicateDialog).getByText("Mali S.")).toBeInTheDocument();
    expect(sendJobRequests).toHaveBeenCalledWith(8, [11, 12]);
    fireEvent.click(screen.getByRole("button", { name: "Review Selection" }));
    expect(screen.getByRole("checkbox", { name: "Select Mali S." })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Select Mali S." })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Select Anan K." })).toBeChecked();
  });

  it("blocks resubmission after a failed conflict refresh, then recovers from a fresh read", async () => {
    sendJobRequests.mockResolvedValue({
      status: "duplicate",
      refreshStatus: "error",
      message: "Current invitation status could not be refreshed.",
    });
    renderSelector();

    fireEvent.click(screen.getByRole("checkbox", { name: "Select Mali S." }));
    fireEvent.click(screen.getByRole("button", { name: "Review & Send" }));
    fireEvent.click(screen.getByRole("button", { name: "Send Invitation" }));
    await screen.findByRole("heading", { name: "Active Invitation Already Exists" });
    fireEvent.click(screen.getByRole("button", { name: "Review Selection" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Current invitation status could not be refreshed",
    );
    expect(screen.getByRole("button", { name: "Review & Send" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Select Mali S." })).toBeDisabled();

    loadJobSentInvitations.mockResolvedValue({ status: "success", items: [] });
    fireEvent.click(screen.getByRole("button", { name: "Refresh invitations" }));

    await waitFor(() => {
      expect(loadJobSentInvitations).toHaveBeenCalledWith(8);
      expect(screen.getByRole("button", { name: "Review & Send" })).toBeEnabled();
    });
    expect(screen.getByRole("checkbox", { name: "Select Mali S." })).toBeChecked();
  });

  it("shows success and retains returned requests as named Pending rows", async () => {
    sendJobRequests.mockResolvedValue({ status: "success", requests: [createdRequest(11)] });
    renderSelector();

    fireEvent.click(screen.getByRole("checkbox", { name: "Select Mali S." }));
    fireEvent.click(screen.getByRole("button", { name: "Review & Send" }));
    fireEvent.click(screen.getByRole("button", { name: "Send Invitation" }));

    expect(await screen.findByText("Request sent to 1 marketer.")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Select Mali S." })).not.toBeChecked();
    expect(
      within(screen.getByRole("region", { name: "Direct Invitations" })).getByText("Mali S."),
    ).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(loadJobSentInvitations).not.toHaveBeenCalled();
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
    renderSelector();

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search marketers by name, bio, or service" }),
      { target: { value: "field research" } },
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
    sendJobRequests.mockResolvedValue({
      status: "success",
      requests: [createdRequest(11), createdRequest(113)],
    });
    renderSelector({ totalMarketers: 101 });

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
    expect(await screen.findByText("Requests sent to 2 marketers.")).toBeInTheDocument();
    const directInvitations = screen.getByRole("region", { name: "Direct Invitations" });
    expect(within(directInvitations).getByText("Mali S.")).toBeInTheDocument();
    expect(within(directInvitations).getByText("Chai N.")).toBeInTheDocument();
    expect(
      within(directInvitations)
        .getAllByRole("listitem")
        .map((invitation) => invitation.querySelector("p")?.textContent),
    ).toEqual(["Chai N.", "Mali S."]);
  });
});
