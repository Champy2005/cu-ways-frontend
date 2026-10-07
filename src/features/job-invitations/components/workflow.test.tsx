import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DemoWorkspace } from "@/features/marketers/demo/demo-workspace";
import { initialState } from "../demo/transitions";
import { demoInvitationActions, getSnapshot, resetInvitationsDemo } from "../demo/store";
import { InvitationsPage, filterInvitations } from "./invitations-page";
import { OfferPage } from "./offer-page";
import { RequestDialog } from "./request-dialog";

vi.mock("next/navigation", () => ({
  usePathname: () => "/demo/marketer",
  useRouter: () => ({ refresh: vi.fn() }),
}));
const noNetwork = vi.fn<typeof fetch>(() =>
  Promise.reject(new Error("Unexpected network request")),
);

beforeEach(() => {
  window.history.replaceState(null, "", "/demo/marketer?view=invitations");
  sessionStorage.clear();
  resetInvitationsDemo();
  noNetwork.mockClear();
  vi.stubGlobal("fetch", noNetwork);
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
afterEach(() => {
  expect(noNetwork).not.toHaveBeenCalled();
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function campaignCard() {
  return within(
    screen
      .getByRole("heading", { name: "Campus Sustainability Campaign" })
      .closest('[data-slot="card"]') as HTMLElement,
  );
}

describe("invitation and offer preview", () => {
  it("accepts, submits, reloads, inspects, and withdraws an offer", async () => {
    const page = render(<DemoWorkspace view="invitations" />);
    await screen.findByRole("heading", { name: "Direct Invitations" });
    fireEvent.click(campaignCard().getByRole("button", { name: "Accept Request" }));
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Confirm" }),
    );
    await screen.findByText("Invitation accepted. You can now submit your custom offer.");
    expect(screen.getByRole("tab", { name: "Pending (1)" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Responded (5)" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    fireEvent.click(campaignCard().getByRole("button", { name: "Submit Offer" }));
    await screen.findByRole("heading", { name: "Submit Your Offer" });
    expect(window.location.search).toContain("requestId=request-041");
    expect(screen.getByRole("button", { name: "Submit Offer" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Proposed Price (THB) *"), {
      target: { value: "9000" },
    });
    fireEvent.change(screen.getByLabelText("Estimated Delivery *"), {
      target: { value: "2026-10-25" },
    });
    fireEvent.change(screen.getByLabelText("Message to Creator (Optional)"), {
      target: { value: "Faculty LINE groups" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit Offer" }));
    await screen.findByText(/Offer submitted successfully!/);
    expect(getSnapshot().offers.at(-1)).toMatchObject({
      price: "9000.00",
      message: "Faculty LINE groups",
      status: "Pending",
    });
    page.unmount();
    render(<DemoWorkspace view="invitations" />);
    await screen.findByRole("heading", { name: "Direct Invitations" });
    fireEvent.click(campaignCard().getByRole("button", { name: "View Offer" }));
    await screen.findByText("Offer already submitted");
    expect(screen.getByLabelText("Proposed Price (THB) *")).toHaveAttribute("readonly");
    fireEvent.click(screen.getByRole("button", { name: "Withdraw Offer" }));
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Withdraw Offer" }),
    );
    await screen.findByRole("heading", { name: "Direct Invitations" });
    expect(campaignCard().getByText("Withdrawn", { exact: true })).toBeInTheDocument();
    fireEvent.click(campaignCard().getByRole("button", { name: "View Offer" }));
    await screen.findByText("Offer withdrawn");
    expect(screen.queryByRole("button", { name: "Withdraw Offer" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit Offer" })).not.toBeInTheDocument();
  });

  it("searches within tabs, previews briefs, declines with a reason, and resets", async () => {
    render(<DemoWorkspace view="invitations" />);
    const search = await screen.findByRole("textbox", {
      name: "Search invitations by title or creator",
    });
    fireEvent.change(search, { target: { value: "Engineering" } });
    expect(
      screen.queryByRole("heading", { name: "Student Wellness Survey 2026" }),
    ).not.toBeInTheDocument();
    fireEvent.click(campaignCard().getByRole("button", { name: "Campaign Brief v2" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("fictional brief");
    fireEvent.click(screen.getByRole("button", { name: "Close brief" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    fireEvent.click(campaignCard().getByRole("button", { name: "Decline" }));
    const dialog = within(screen.getByRole("alertdialog"));
    fireEvent.click(dialog.getByRole("button", { name: "Schedule conflict" }));
    fireEvent.change(dialog.getByLabelText("Note (optional)"), {
      target: { value: "Already booked" },
    });
    fireEvent.click(dialog.getByRole("button", { name: "Decline Request" }));
    await screen.findByText("Invitation declined. Your response has been saved.");
    expect(getSnapshot().invitations[0]).toMatchObject({
      declineReason: "Schedule conflict",
      declineNote: "Already booked",
    });
    fireEvent.click(screen.getByRole("button", { name: "Reset demo" }));
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "Pending (2)" })).toBeInTheDocument(),
    );
  });

  it("restores the offer screen on direct links and handles back navigation", async () => {
    window.history.replaceState(null, "", "/demo/marketer?view=offer&requestId=request-063");
    render(<DemoWorkspace view="offer" requestId="request-063" />);
    await screen.findByRole("heading", { name: "Submit Your Offer" });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await screen.findByRole("heading", { name: "Direct Invitations" });
    act(() => {
      window.history.replaceState(null, "", "/demo/marketer?view=offer&requestId=request-074");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    await screen.findByText("Offer already submitted");
  });
});

describe("edge states and failures", () => {
  it("filters by creator/title and distinguishes pending from responded", () => {
    expect(
      filterInvitations(initialState.invitations, "pending", " arts ").map((entry) => entry.id),
    ).toEqual(["request-052"]);
    expect(
      filterInvitations(initialState.invitations, "responded", "Library").map((entry) => entry.id),
    ).toEqual(["request-085"]);
    expect(filterInvitations(initialState.invitations, "pending", "Library")).toEqual([]);
  });
  it.each(["pending", "responded"] as const)(
    "shows the %s empty state and a separate search-empty state",
    (tab) => {
      render(
        <InvitationsPage
          invitations={[]}
          offers={[]}
          actions={demoInvitationActions}
          tab={tab}
          onTab={vi.fn()}
          onOffer={vi.fn()}
          onBack={vi.fn()}
          notice={null}
          onDismissNotice={vi.fn()}
        />,
      );
      expect(
        screen.getByRole("heading", {
          name:
            tab === "pending"
              ? "All caught up! No pending requests"
              : "No responded invitations yet",
        }),
      ).toBeInTheDocument();
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "unknown" } });
      expect(screen.getByRole("heading", { name: "No matching invitations" })).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
      expect(screen.getByRole("textbox")).toHaveValue("");
    },
  );
  it.each([
    undefined,
    initialState.invitations[0],
    initialState.invitations[4],
    initialState.invitations[5],
  ])("blocks a missing or ineligible offer request", (request) => {
    render(
      <OfferPage
        request={request}
        actions={demoInvitationActions}
        onBack={vi.fn()}
        onSubmitted={vi.fn()}
      />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByLabelText("Proposed Price (THB) *")).not.toBeInTheDocument();
  });
  it("preserves the draft on failure, prevents double submission, and confirms cancellation", async () => {
    let reject: (error: Error) => void = () => {};
    const submit = vi.fn(
      () =>
        new Promise<void>((_, fail) => {
          reject = fail;
        }),
    );
    const onBack = vi.fn();
    render(
      <OfferPage
        request={initialState.invitations[2]}
        actions={{ ...demoInvitationActions, submit }}
        onBack={onBack}
        onSubmitted={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Proposed Price (THB) *"), { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText("Estimated Delivery *"), {
      target: { value: "2026-10-28" },
    });
    const submitButton = screen.getByRole("button", { name: "Submit Offer" });
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);
    expect(submit).toHaveBeenCalledOnce();
    await act(async () => reject(new Error("An offer already exists for this invitation.")));
    expect(screen.getByRole("alert")).toHaveTextContent("already exists");
    expect(screen.getByLabelText("Proposed Price (THB) *")).toHaveValue("0");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent("Discard your offer draft?");
    fireEvent.click(screen.getByRole("button", { name: "Keep Editing" }));
    expect(onBack).not.toHaveBeenCalled();
  });
  it("shows inactive-request errors inside the confirmation", async () => {
    const accept = vi.fn().mockRejectedValue(new Error("This invitation is no longer pending."));
    const responded = vi.fn();
    render(
      <RequestDialog
        request={initialState.invitations[0]}
        mode="accept"
        actions={{ ...demoInvitationActions, accept }}
        onClose={vi.fn()}
        onResponded={responded}
        finalFocus={() => null}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("no longer pending");
    expect(responded).not.toHaveBeenCalled();
  });
  it("announces invalid date and price fields after interaction", () => {
    render(
      <OfferPage
        request={initialState.invitations[2]}
        actions={demoInvitationActions}
        onBack={vi.fn()}
        onSubmitted={vi.fn()}
      />,
    );
    const price = screen.getByLabelText("Proposed Price (THB) *");
    fireEvent.change(price, { target: { value: "-1" } });
    fireEvent.blur(price);
    expect(price).toHaveAttribute("aria-invalid", "true");
    const delivery = screen.getByLabelText("Estimated Delivery *");
    fireEvent.change(delivery, { target: { value: "2026-10-29" } });
    fireEvent.blur(delivery);
    expect(delivery).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Delivery date cannot be after the job deadline.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit Offer" })).toBeDisabled();
  });
});
