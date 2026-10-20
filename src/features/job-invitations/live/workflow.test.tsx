import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { LiveInvitationsPage, filterLiveInvitations } from "./invitations-page";
import { LiveOfferPage, submissionUnavailable } from "./offer-page";
import { reloadInvitations, respondToInvitation, submitInvitationOffer } from "./browser-api";
import { invitationEntry, savedOffer } from "./test-fixtures";
import { LiveInvitationCard } from "./invitation-card";

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(window.location.search),
}));
vi.mock("./browser-api", () => ({
  reloadInvitations: vi.fn(),
  respondToInvitation: vi.fn(),
  submitInvitationOffer: vi.fn(),
}));
beforeEach(() => {
  vi.resetAllMocks();
  window.history.replaceState(null, "", "/marketer/invitations");
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function fillOffer() {
  fireEvent.change(screen.getByLabelText("Proposed Price (THB) *"), { target: { value: "9000" } });
  fireEvent.change(screen.getByLabelText("Estimated Delivery *"), {
    target: { value: "2099-10-25" },
  });
  fireEvent.change(screen.getByLabelText("Message to Creator (Optional)"), {
    target: { value: "Faculty groups" },
  });
}

describe("live US20 invitations", () => {
  it("updates relative invitation times after retry and uses fresh server times after prop refresh", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-15T03:00:00Z"));
    window.history.replaceState(null, "", "/marketer/invitations?tab=responded");
    vi.mocked(reloadInvitations).mockResolvedValue([invitationEntry()]);
    const view = render(
      <LiveInvitationsPage
        initial={[{ ...invitationEntry(), offersUnavailable: true }]}
        referenceTime="2026-10-15T02:00:00Z"
      />,
    );
    expect(screen.getByText("Invited 2h ago")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByText("Invited 3h ago");
    view.rerender(
      <LiveInvitationsPage initial={[invitationEntry()]} referenceTime="2026-10-15T04:00:00Z" />,
    );
    expect(screen.getByText("Invited 4h ago")).toBeInTheDocument();
  });
  it("shows only supported metadata and safe real links", () => {
    render(
      <LiveInvitationsPage
        initial={[invitationEntry("Pending")]}
        referenceTime="2026-10-15T02:00:00Z"
      />,
    );
    expect(screen.getByRole("heading", { name: "Campus survey", level: 2 })).toBeInTheDocument();
    expect(screen.getByText("Job #3")).toBeInTheDocument();
    expect(screen.getByText("Awaiting your response")).toBeInTheDocument();
    expect(document.querySelectorAll(".ji-tags > span")).toHaveLength(2);
    expect(screen.queryByText(/Job status:|Request status:/)).not.toBeInTheDocument();
    const details = screen.getByText("View survey details").closest("details")!;
    expect(details).not.toHaveAttribute("open");
    fireEvent.click(screen.getByText("View survey details"));
    expect(screen.getByRole("link", { name: "Open survey" })).toHaveAttribute(
      "href",
      "https://example.test/survey",
    );
    expect(screen.getByText("No brief attached")).toBeInTheDocument();
    expect(
      screen.queryByText(/fixed|listed budget|Hi! We noticed|Campaign Sustainability/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /withdraw/i })).not.toBeInTheDocument();
  });
  it("filters job IDs, survey titles and creator names within tabs", () => {
    const entries = [
      invitationEntry("Pending"),
      { ...invitationEntry(), request: { ...invitationEntry().request, job_request_id: 8 } },
    ];
    for (const term of ["#3", "Campus", "test creator"])
      expect(filterLiveInvitations(entries, "pending", term)).toHaveLength(1);
    expect(filterLiveInvitations(entries, "responded", "not found")).toHaveLength(0);
  });
  it("finds an invitation by its saved job title", () => {
    const entry = invitationEntry("Pending");
    entry.request.job.title = "Campus outreach campaign";
    expect(filterLiveInvitations([entry], "pending", "outreach")).toEqual([entry]);
  });
  it("accepts with confirmation and reloads the saved response", async () => {
    vi.mocked(respondToInvitation).mockResolvedValue(invitationEntry().request);
    vi.mocked(reloadInvitations).mockResolvedValue([invitationEntry()]);
    render(
      <LiveInvitationsPage
        initial={[invitationEntry("Pending")]}
        referenceTime="2026-10-15T02:00:00Z"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Accept Request" }));
    expect(screen.getByText(/you have not been hired yet/)).toBeInTheDocument();
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Confirm" }),
    );
    await screen.findByText("Invitation accepted");
    expect(respondToInvitation).toHaveBeenCalledWith(7, undefined);
    expect(screen.getByRole("tab", { name: "Responded (1)" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(document.querySelector(".ji-live-response time")).toHaveTextContent("15 Oct 2026");
    expect(screen.getByRole("link", { name: "Submit Offer" })).toHaveClass("ji-primary");
  });
  it("declines with optional reason and note", async () => {
    vi.mocked(respondToInvitation).mockResolvedValue(invitationEntry("Declined").request);
    vi.mocked(reloadInvitations).mockResolvedValue([invitationEntry("Declined")]);
    render(
      <LiveInvitationsPage
        initial={[invitationEntry("Pending")]}
        referenceTime="2026-10-15T02:00:00Z"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Decline" }));
    fireEvent.click(screen.getByRole("button", { name: "Schedule conflict" }));
    fireEvent.change(screen.getByLabelText("Note (optional)"), {
      target: { value: "Unavailable" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Decline Request" }));
    await screen.findByText("Invitation declined");
    expect(respondToInvitation).toHaveBeenCalledWith(7, {
      reason: "Schedule conflict",
      note: "Unavailable",
    });
  });
  it("shows the empty inbox without fictional records", () => {
    render(<LiveInvitationsPage initial={[]} referenceTime="2026-10-15T02:00:00Z" />);
    expect(
      screen.getByRole("heading", { name: "All caught up! No pending requests" }),
    ).toBeInTheDocument();
    expect(document.querySelector(".ji-empty img")).toHaveAttribute(
      "src",
      "/marketer-assets/mascot.svg",
    );
    expect(screen.queryByRole("button", { name: /refresh|try again/i })).not.toBeInTheDocument();
  });
  it("uses a survey-based heading for multi-survey jobs and retains every survey in details", () => {
    const entry = invitationEntry("Pending");
    entry.request.job.surveys.push({
      ...entry.request.job.surveys[0],
      survey_id: 9,
      title: "Student wellbeing",
    });
    render(<LiveInvitationsPage initial={[entry]} referenceTime="2026-10-15T02:00:00Z" />);
    expect(
      screen.getByRole("heading", { name: "Campus survey + 1 more survey" }),
    ).toBeInTheDocument();
    expect(document.querySelectorAll(".ji-tags > span")).toHaveLength(2);
    expect(screen.getByText("Deadline: Not specified")).toBeInTheDocument();
    expect(screen.getByText("Target: Not specified")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Student wellbeing", hidden: true }),
    ).not.toBeVisible();
    fireEvent.click(screen.getByText("View survey details"));
    expect(screen.getByRole("heading", { name: "Student wellbeing" })).toBeVisible();
    expect(screen.getAllByRole("link", { name: "Open survey" })).toHaveLength(2);
  });
  it.each(["Pending", "Accepted", "Declined", "Closed"] as const)(
    "explains the %s invitation state without a competing job status",
    (status) => {
      const labels = {
        Pending: "Awaiting your response",
        Accepted: "Invitation accepted",
        Declined: "Invitation declined",
        Closed: "Invitation closed",
      };
      render(
        <LiveInvitationCard
          entry={invitationEntry(status)}
          referenceTime="2026-10-15T02:00:00Z"
          blocked={false}
          retrying={false}
          onRespond={vi.fn()}
          onRetry={vi.fn()}
        />,
      );
      expect(screen.getByText(labels[status])).toBeInTheDocument();
      expect(screen.queryByText(/Job status:|Request status:/)).not.toBeInTheDocument();
    },
  );
  it("explains job ineligibility and blocks a stale pending invitation", () => {
    const entry = invitationEntry("Pending");
    entry.request.job.job_status = "Cancelled";
    render(<LiveInvitationsPage initial={[entry]} referenceTime="2026-10-15T02:00:00Z" />);
    expect(screen.getByText("This job is no longer accepting offers.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Accept Request" })).toBeDisabled();
  });
  it("offers a retry instead of a submit action when existing offers cannot be checked", () => {
    window.history.replaceState(null, "", "/marketer/invitations?tab=responded");
    render(
      <LiveInvitationsPage
        initial={[{ ...invitationEntry(), offersUnavailable: true }]}
        referenceTime="2026-10-15T02:00:00Z"
      />,
    );
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Submit Offer" })).not.toBeInTheDocument();
  });
  it("disables an open confirmation when a conflict refresh finds an ineligible job", async () => {
    const unavailable = invitationEntry("Pending");
    unavailable.request.job.job_status = "Cancelled";
    vi.mocked(respondToInvitation).mockRejectedValue(
      new ApiError(409, "job_not_pending", "This job is no longer accepting offers."),
    );
    vi.mocked(reloadInvitations).mockResolvedValue([unavailable]);
    render(
      <LiveInvitationsPage
        initial={[invitationEntry("Pending")]}
        referenceTime="2026-10-15T02:00:00Z"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Accept Request" }));
    const dialog = screen.getByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));
    await waitFor(() =>
      expect(within(dialog).getByRole("button", { name: "Confirm" })).toBeDisabled(),
    );
    expect(respondToInvitation).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Invitation accepted\./)).not.toBeInTheDocument();
  });
});

describe("live US21 offers", () => {
  it("prefills withdrawn terms, preserves edits on refresh, and locks the replacement after submission", async () => {
    const withdrawn = { ...invitationEntry(), offer: savedOffer("Withdrawn") };
    const replacement = { ...savedOffer(), offer_id: 6, offered_price: "9500.00" };
    vi.mocked(submitInvitationOffer).mockResolvedValue(replacement);
    vi.mocked(reloadInvitations).mockResolvedValue([{ ...invitationEntry(), offer: replacement }]);
    const view = render(<LiveOfferPage initial={[withdrawn]} />);
    expect(screen.getByTestId("offer-withdrawn-banner")).toHaveTextContent("was withdrawn");
    const price = screen.getByLabelText("Proposed Price (THB) *");
    expect(price).toHaveValue("9000.00");
    expect(screen.getByLabelText("Estimated Delivery *")).toHaveValue("2099-10-25");
    expect(screen.getByLabelText("Message to Creator (Optional)")).toHaveValue("Faculty groups");
    fireEvent.change(price, { target: { value: "9500" } });
    view.rerender(<LiveOfferPage initial={[{ ...withdrawn }]} />);
    expect(price).toHaveValue("9500");
    fireEvent.click(screen.getByRole("button", { name: "Submit Offer" }));
    await screen.findByRole("heading", { name: "Your Offer" });
    expect(price).toHaveAttribute("readonly");
    expect(price).toHaveValue("9500.00");
    expect(submitInvitationOffer).toHaveBeenCalledWith(7, {
      price: "9500",
      deliveryDate: "2099-10-25",
      message: "Faculty groups",
    });
  });

  it("prefills terms when fresh server data changes the current offer to Withdrawn", () => {
    const view = render(
      <LiveOfferPage initial={[{ ...invitationEntry(), offer: savedOffer() }]} />,
    );
    view.rerender(
      <LiveOfferPage initial={[{ ...invitationEntry(), offer: savedOffer("Withdrawn") }]} />,
    );
    expect(screen.getByLabelText("Proposed Price (THB) *")).toHaveValue("9000.00");
    expect(screen.getByLabelText("Proposed Price (THB) *")).not.toHaveAttribute("readonly");
  });

  it("keeps a withdrawn offer read-only after the job deadline", () => {
    const entry = { ...invitationEntry(), offer: savedOffer("Withdrawn") };
    entry.request.job.deadline = "2000-01-01T00:00:00Z";
    render(<LiveOfferPage initial={[entry]} />);
    expect(screen.getByLabelText("Proposed Price (THB) *")).toHaveAttribute("readonly");
    expect(screen.queryByRole("button", { name: "Submit Offer" })).not.toBeInTheDocument();
    expect(screen.getByText(/The job deadline has passed/)).toBeInTheDocument();
  });

  it("keeps a just-saved offer read-only when its refresh lookup fails, then recovers on retry", async () => {
    vi.mocked(submitInvitationOffer).mockResolvedValue(savedOffer());
    vi.mocked(reloadInvitations)
      .mockResolvedValueOnce([{ ...invitationEntry(), offersUnavailable: true }])
      .mockResolvedValueOnce([{ ...invitationEntry(), offer: savedOffer() }]);
    render(<LiveOfferPage initial={[invitationEntry()]} />);
    fillOffer();
    fireEvent.click(screen.getByRole("button", { name: "Submit Offer" }));
    await screen.findByText(/Your change was saved, but current data could not be refreshed/);
    expect(screen.getByRole("heading", { name: "Your Offer" })).toBeInTheDocument();
    expect(screen.getByLabelText("Proposed Price (THB) *")).toHaveValue("9000.00");
    expect(screen.getByLabelText("Proposed Price (THB) *")).toHaveAttribute("readonly");
    expect(screen.queryByRole("button", { name: "Submit Offer" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() =>
      expect(screen.queryByText(/current data could not be refreshed/)).not.toBeInTheDocument(),
    );
    expect(screen.getByLabelText("Proposed Price (THB) *")).toHaveAttribute("readonly");
    expect(submitInvitationOffer).toHaveBeenCalledTimes(1);
  });
  it("saves once and locks the confirmed offer even if refresh fails", async () => {
    let resolveSave!: (value: ReturnType<typeof savedOffer>) => void;
    vi.mocked(submitInvitationOffer).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    vi.mocked(reloadInvitations).mockRejectedValue(new Error("offline"));
    render(<LiveOfferPage initial={[invitationEntry()]} />);
    fillOffer();
    fireEvent.click(screen.getByRole("button", { name: "Submit Offer" }));
    fireEvent.submit(screen.getByRole("button", { name: "Submitting…" }).closest("form")!);
    expect(submitInvitationOffer).toHaveBeenCalledTimes(1);
    resolveSave(savedOffer());
    await screen.findByText(/Your change was saved, but current data could not be refreshed/);
    expect(screen.getByLabelText("Proposed Price (THB) *")).toHaveAttribute("readonly");
    expect(screen.queryByRole("button", { name: "Submit Offer" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /withdraw|resubmit/i })).not.toBeInTheDocument();
  });
  it("preserves drafts on validation/network failure and ordinary prop refresh", async () => {
    vi.mocked(submitInvitationOffer).mockRejectedValue(
      new ApiError(422, "invalid_offer", "Check the delivery date."),
    );
    vi.mocked(reloadInvitations).mockResolvedValue([invitationEntry()]);
    const view = render(<LiveOfferPage initial={[invitationEntry()]} />);
    fillOffer();
    fireEvent.click(screen.getByRole("button", { name: "Submit Offer" }));
    await screen.findByText("Check the delivery date.");
    view.rerender(<LiveOfferPage initial={[invitationEntry()]} />);
    expect(screen.getByLabelText("Message to Creator (Optional)")).toHaveValue("Faculty groups");
    expect(screen.getByLabelText("Proposed Price (THB) *")).toHaveValue("9000");
    expect(screen.queryByText(/submitted successfully/i)).not.toBeInTheDocument();
  });
  it("reconciles conflicts to existing offers without claiming success", async () => {
    vi.mocked(submitInvitationOffer).mockRejectedValue(
      new ApiError(409, "offer_already_exists", "An active offer already exists."),
    );
    vi.mocked(reloadInvitations).mockResolvedValue([{ ...invitationEntry(), offer: savedOffer() }]);
    render(<LiveOfferPage initial={[invitationEntry()]} />);
    fillOffer();
    fireEvent.click(screen.getByRole("button", { name: "Submit Offer" }));
    await screen.findByText("An active offer already exists.");
    expect(screen.getByLabelText("Proposed Price (THB) *")).toHaveAttribute("readonly");
    expect(screen.queryByText(/submitted successfully/i)).not.toBeInTheDocument();
  });
  it.each(["Pending", "Accepted", "Rejected", "Withdrawn"] as const)(
    "displays %s offers read-only even for closed requests",
    (status) => {
      render(
        <LiveOfferPage initial={[{ ...invitationEntry("Closed"), offer: savedOffer(status) }]} />,
      );
      expect(screen.getByLabelText("Proposed Price (THB) *")).toHaveAttribute("readonly");
      expect(document.querySelectorAll(".ji-tags > span")).toHaveLength(2);
      expect(
        screen.queryByText(/Job status:|Request status:|Invitation accepted|Propose an amount/),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/\/300/)).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Back to Invitations" })).toHaveClass("ji-primary");
      expect(
        document
          .querySelector(".ji-existing")!
          .compareDocumentPosition(document.querySelector(".ji-live-summary")!) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      if (status === "Accepted")
        expect(screen.getByText("Offer accepted. You’ve been hired")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /submit|withdraw|resubmit/i }),
      ).not.toBeInTheDocument();
    },
  );
  it("explains invalid fields on blur while preserving the draft", () => {
    render(<LiveOfferPage initial={[invitationEntry()]} />);
    fillOffer();
    const price = screen.getByLabelText("Proposed Price (THB) *");
    fireEvent.change(price, { target: { value: "1.234" } });
    expect(screen.getByRole("button", { name: "Submit Offer" })).toBeDisabled();
    fireEvent.blur(price);
    expect(screen.getByText(/Enter a price from/)).toBeVisible();
    fireEvent.change(price, { target: { value: "0" } });
    expect(screen.queryByText(/Enter a price from/)).not.toBeInTheDocument();
    const message = screen.getByLabelText("Message to Creator (Optional)");
    fireEvent.change(message, { target: { value: "😀".repeat(301) } });
    fireEvent.blur(message);
    expect(screen.getByText("Keep your message to 300 characters or fewer.")).toBeVisible();
    expect(message).toHaveValue("😀".repeat(301));
    fireEvent.change(message, { target: { value: "😀".repeat(300) } });
    expect(screen.getByRole("button", { name: "Submit Offer" })).toBeEnabled();
  });
  it("disables submission when offer lookup fails and can retry", async () => {
    vi.mocked(reloadInvitations).mockResolvedValue([invitationEntry()]);
    render(<LiveOfferPage initial={[{ ...invitationEntry(), offersUnavailable: true }]} />);
    expect(screen.getByRole("button", { name: "Submit Offer" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.getByLabelText("Proposed Price (THB) *")).toBeEnabled());
  });
  it("requires discard confirmation and respects job/request eligibility", () => {
    render(<LiveOfferPage initial={[invitationEntry()]} />);
    fillOffer();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Keep Editing" }));
    expect(screen.getByLabelText("Proposed Price (THB) *")).toHaveValue("9000");
    const past = {
      ...invitationEntry(),
      request: {
        ...invitationEntry().request,
        job: { ...invitationEntry().request.job, deadline: "2026-01-01T00:00:00Z" },
      },
    };
    expect(submissionUnavailable(past, "2026-10-15")).toContain("deadline has passed");
    expect(submissionUnavailable(invitationEntry("Pending"), "2026-10-15")).toContain(
      "Accept this invitation",
    );
  });
});
