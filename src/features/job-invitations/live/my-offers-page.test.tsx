import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { MyOffersPage } from "./my-offers-page";
import { withdrawOffer } from "./browser-api";
import { receivedRequest, savedOffer } from "./test-fixtures";
import { ApiError } from "@/lib/api/errors";

vi.mock("./browser-api", () => ({
  withdrawOffer: vi.fn(),
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
    vi.mocked(withdrawOffer).mockRejectedValue(
      new ApiError(409, "offer_not_pending", "only a pending offer can be withdrawn"),
    );

    render(<MyOffersPage initialOffers={[{ offer: baseOffer, request: baseRequest }]} />);

    fireEvent.click(screen.getByRole("button", { name: "Withdraw offer" }));
    fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Only a pending offer can be withdrawn. The creator may have already accepted or rejected this offer.",
      );
    });
  });

  it("renders empty state when no offers exist", () => {
    render(<MyOffersPage initialOffers={[]} />);

    expect(screen.getByText("You have 0 offers on survey jobs")).toBeInTheDocument();
    expect(screen.getByText("You haven't submitted any offers yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View invitations" })).toBeInTheDocument();
  });
});
