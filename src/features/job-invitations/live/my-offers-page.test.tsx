import { render, screen, fireEvent, waitFor, cleanup, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { MyOffersPage } from "./my-offers-page";
import { reloadMarketerOffers, withdrawOffer } from "./browser-api";
import { receivedRequest, savedOffer } from "./test-fixtures";
import { ApiError } from "@/lib/api/errors";

vi.mock("./browser-api", () => ({
  withdrawOffer: vi.fn(),
  reloadMarketerOffers: vi.fn(),
}));

describe("MyOffersPage", () => {
  const baseRequest = receivedRequest("Accepted");
  const baseOffer = {
    ...savedOffer(),
    offer_id: 201,
    offered_price: "1200.00",
    offer_status: "Pending" as const,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(reloadMarketerOffers).mockResolvedValue({
      offers: [{ offer: baseOffer, request: baseRequest }],
      offersUnavailable: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders list of offers and count in subtitle", () => {
    render(<MyOffersPage initialOffers={[{ offer: baseOffer, request: baseRequest }]} />);

    expect(screen.getByRole("heading", { name: "My offers" })).toBeInTheDocument();
    expect(screen.getByText("You have 1 offer on survey jobs")).toBeInTheDocument();
    expect(screen.getByText("Campus survey")).toBeInTheDocument();
  });

  it("opens modal and successfully withdraws offer, updating status to Withdrawn", async () => {
    const updatedOffer = {
      ...baseOffer,
      offer_status: "Withdrawn" as const,
    };
    vi.mocked(withdrawOffer).mockResolvedValue(updatedOffer);

    render(<MyOffersPage initialOffers={[{ offer: baseOffer, request: baseRequest }]} />);

    // Click withdraw button on card
    fireEvent.click(screen.getByRole("button", { name: "Withdraw offer" }));

    // Modal opens
    expect(screen.getByRole("heading", { name: "Withdraw this offer?" })).toBeInTheDocument();

    // Confirm withdraw
    fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));

    await waitFor(() => {
      expect(withdrawOffer).toHaveBeenCalledWith(201);
    });

    // Modal closes, notice appears, card badge changes to Withdrawn, Resubmit link appears
    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "Withdraw this offer?" }),
      ).not.toBeInTheDocument();
    });

    expect(screen.getByRole("status")).toHaveTextContent("Offer withdrawn successfully.");
    expect(screen.getByText("Withdrawn")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Resubmit offer" })).toBeInTheDocument();
  });

  it("displays error alert when withdrawal fails with conflict", async () => {
    vi.mocked(reloadMarketerOffers).mockResolvedValue({
      offers: [{ offer: { ...baseOffer, offer_status: "Accepted" }, request: baseRequest }],
      offersUnavailable: false,
    });
    vi.mocked(withdrawOffer).mockRejectedValue(
      new ApiError(409, "offer_not_pending", "only a pending offer can be withdrawn"),
    );

    render(<MyOffersPage initialOffers={[{ offer: baseOffer, request: baseRequest }]} />);

    fireEvent.click(screen.getByRole("button", { name: "Withdraw offer" }));
    fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "This offer can no longer be withdrawn. Check its current status before trying again.",
      );
    });
    expect(screen.getByText("Accepted")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Withdraw" })).toBeDisabled();
    expect(reloadMarketerOffers).toHaveBeenCalledOnce();
    expect(withdrawOffer).toHaveBeenCalledOnce();
  });

  it("filters statuses while preserving history and only permits the current offer to be resubmitted", () => {
    render(
      <MyOffersPage
        initialOffers={[
          { offer: baseOffer, request: baseRequest },
          {
            offer: { ...baseOffer, offer_id: 200, offer_status: "Withdrawn" },
            request: baseRequest,
          },
        ]}
      />,
    );
    expect(screen.getAllByRole("tab")).toHaveLength(5);
    fireEvent.click(screen.getByRole("tab", { name: "Withdrawn (1)" }));
    expect(screen.getByTestId("my-offer-card-200")).toBeInTheDocument();
    expect(screen.queryByTestId("my-offer-card-201")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Resubmit offer" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Accepted (0)" }));
    expect(screen.getByText("No accepted offers.")).toBeInTheDocument();
  });

  it("reconciles refreshed server props and disables a stale open confirmation", () => {
    const view = render(
      <MyOffersPage initialOffers={[{ offer: baseOffer, request: baseRequest }]} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Withdraw offer" }));
    view.rerender(
      <MyOffersPage
        initialOffers={[
          { offer: { ...baseOffer, offer_status: "Accepted" }, request: baseRequest },
        ]}
      />,
    );
    expect(screen.getByText("Accepted")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Withdraw" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));
    expect(withdrawOffer).not.toHaveBeenCalled();
  });

  it("starts focus on Keep offer and restores focus to the trigger on cancellation", async () => {
    render(<MyOffersPage initialOffers={[{ offer: baseOffer, request: baseRequest }]} />);
    const trigger = screen.getByRole("button", { name: "Withdraw offer" });
    trigger.focus();
    fireEvent.click(trigger);
    await waitFor(() => expect(screen.getByRole("button", { name: "Keep offer" })).toHaveFocus());
    fireEvent.click(screen.getByRole("button", { name: "Keep offer" }));
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("submits once and restores focus to the heading when the trigger is replaced", async () => {
    let resolve!: (value: ReturnType<typeof savedOffer>) => void;
    vi.mocked(withdrawOffer).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    render(<MyOffersPage initialOffers={[{ offer: baseOffer, request: baseRequest }]} />);
    fireEvent.click(screen.getByRole("button", { name: "Withdraw offer" }));
    fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));
    fireEvent.click(screen.getByRole("button", { name: "Withdrawing…" }));
    expect(withdrawOffer).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Keep offer" })).toBeDisabled();
    await act(async () => resolve({ ...baseOffer, offer_status: "Withdrawn" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "My offers" })).toHaveFocus());
  });

  it.each([401, 403])("provides recovery for an HTTP %i withdrawal failure", async (status) => {
    vi.mocked(withdrawOffer).mockRejectedValue(new ApiError(status, "unauthorized", "Denied"));
    render(<MyOffersPage initialOffers={[{ offer: baseOffer, request: baseRequest }]} />);
    fireEvent.click(screen.getByRole("button", { name: "Withdraw offer" }));
    fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Withdraw" })).toBeDisabled());
    fireEvent.click(screen.getByRole("button", { name: "Keep offer" }));
    expect(
      screen.getByRole("link", {
        name: status === 401 ? "Sign in again" : "Open marketer profile",
      }),
    ).toHaveAttribute("href", status === 401 ? "/login" : "/marketer/profile");
    expect(reloadMarketerOffers).not.toHaveBeenCalled();
  });

  it("blocks uncertain outcomes until a complete refresh succeeds, preserving known offers", async () => {
    vi.mocked(withdrawOffer).mockRejectedValue(new Error("offline"));
    vi.mocked(reloadMarketerOffers).mockRejectedValueOnce(new Error("offline"));
    render(<MyOffersPage initialOffers={[{ offer: baseOffer, request: baseRequest }]} />);
    fireEvent.click(screen.getByRole("button", { name: "Withdraw offer" }));
    fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));
    await screen.findByText(/Current offers could not be loaded/);
    fireEvent.click(screen.getByRole("button", { name: "Keep offer" }));
    expect(screen.getByRole("button", { name: "Withdraw offer" })).toBeDisabled();
    vi.mocked(reloadMarketerOffers).mockResolvedValueOnce({ offers: [], offersUnavailable: true });
    fireEvent.click(screen.getByRole("button", { name: "Refresh offers" }));
    await screen.findByText(/Some offers could not be loaded/);
    expect(screen.getByTestId("my-offer-card-201")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Withdraw offer" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Refresh offers" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Withdraw offer" })).toBeEnabled(),
    );
    expect(withdrawOffer).toHaveBeenCalledOnce();
  });

  it("renders empty state when no offers exist", () => {
    render(<MyOffersPage initialOffers={[]} />);

    expect(screen.getByText("You have 0 offers on survey jobs")).toBeInTheDocument();
    expect(screen.getByText("You haven't submitted any offers yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View invitations" })).toBeInTheDocument();
  });
});
