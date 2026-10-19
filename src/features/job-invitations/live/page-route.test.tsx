import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { requireSession } from "@/lib/auth/guards";
import { getInvitations, getMarketerOffers } from "./api";
import { renderInvitations, renderMarketerOffers } from "./page-route";
import { invitationEntry } from "./test-fixtures";

vi.mock("@/lib/auth/guards", () => ({ requireSession: vi.fn() }));
vi.mock("./api", () => ({ getInvitations: vi.fn(), getMarketerOffers: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("./invitations-page", () => ({ LiveInvitationsPage: () => <h1>Live invitation list</h1> }));
vi.mock("./offer-page", () => ({ LiveOfferPage: () => <h1>Live offer details</h1> }));
vi.mock("./my-offers-page", () => ({ MyOffersPage: () => <h1>Live offer history</h1> }));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getInvitations).mockResolvedValue([invitationEntry()]);
});
afterEach(cleanup);

describe("live page server boundaries", () => {
  it("composes the offer dashboard and gives expired sessions an actionable fallback", async () => {
    vi.mocked(getMarketerOffers).mockResolvedValue({ offers: [], offersUnavailable: false });
    const view = render(await renderMarketerOffers());
    expect(screen.getByRole("heading", { name: "Live offer history" })).toBeInTheDocument();
    view.unmount();
    vi.mocked(getMarketerOffers).mockRejectedValue(
      new ApiError(401, "unauthorized", "Please sign in again."),
    );
    render(await renderMarketerOffers());
    expect(screen.getByRole("heading", { name: "My offers unavailable" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  });

  it("requires a session and composes live data, never demo records", async () => {
    render(await renderInvitations());
    expect(requireSession).toHaveBeenCalledOnce();
    expect(screen.getByRole("heading", { name: "Live invitation list" })).toBeInTheDocument();
  });
  it.each([undefined, "0", "2147483648", "bad"])(
    "rejects invalid offer query %s before a backend read",
    async (id) => {
      render(await renderInvitations(id, true));
      expect(screen.getByRole("alert")).toHaveTextContent("Choose an accepted invitation");
      expect(getInvitations).not.toHaveBeenCalled();
    },
  );
  it("loads the selected owned invitation on direct offer links", async () => {
    render(await renderInvitations("7", true));
    expect(getInvitations).toHaveBeenCalledWith("7");
    expect(screen.getByRole("heading", { name: "Live offer details" })).toBeInTheDocument();
  });
  it.each([
    [401, "unauthorized", "Your session expired. Please sign in again."],
    [403, "marketer_profile_required", "A marketer profile is required to view invitations."],
    [404, "job_request_not_found", "This invitation could not be found."],
  ])("handles backend status %i without showing fictional data", async (status, code, message) => {
    vi.mocked(getInvitations).mockRejectedValue(new ApiError(status, code, "upstream failure"));
    render(await renderInvitations("7", true));
    expect(screen.getByRole("alert")).toHaveTextContent(message);
    expect(screen.queryByRole("heading", { name: "Live offer details" })).not.toBeInTheDocument();
  });
});
