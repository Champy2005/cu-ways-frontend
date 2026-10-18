import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";
import { MyOfferCard } from "./my-offer-card";
import { receivedRequest, savedOffer } from "./test-fixtures";

describe("MyOfferCard", () => {
  afterEach(() => {
    cleanup();
  });

  const baseRequest = receivedRequest("Accepted");
  const baseOffer = {
    ...savedOffer(),
    offer_id: 101,
    offered_price: "1200.00",
    delivery_date: "2026-10-15",
    offer_status: "Pending" as const,
  };

  it("renders pending offer with price, due date, status badge, and active Withdraw button", () => {
    const handleWithdraw = vi.fn();
    render(
      <MyOfferCard offer={baseOffer} request={baseRequest} onWithdrawClick={handleWithdraw} />,
    );

    expect(screen.getByText("Campus survey")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("1,200")).toBeInTheDocument();
    expect(screen.getByText("THB")).toBeInTheDocument();
    expect(screen.getByText("Due 15 Oct 2026")).toBeInTheDocument();

    const withdrawBtn = screen.getByRole("button", { name: "Withdraw offer" });
    expect(withdrawBtn).toBeEnabled();
    fireEvent.click(withdrawBtn);
    expect(handleWithdraw).toHaveBeenCalledWith(baseOffer, "Campus survey");
  });

  it("renders accepted offer with disabled Withdraw button", () => {
    const acceptedOffer = {
      ...baseOffer,
      offer_id: 102,
      offered_price: "1400.00",
      offer_status: "Accepted" as const,
    };

    render(<MyOfferCard offer={acceptedOffer} request={baseRequest} onWithdrawClick={vi.fn()} />);

    expect(screen.getByText("Accepted")).toBeInTheDocument();
    expect(screen.getByText("1,400")).toBeInTheDocument();
    const withdrawBtn = screen.getByRole("button", { name: "Withdraw offer" });
    expect(withdrawBtn).toBeDisabled();
  });

  it("renders withdrawn offer with Resubmit offer link", () => {
    const withdrawnOffer = {
      ...baseOffer,
      offer_id: 103,
      offer_status: "Withdrawn" as const,
    };

    render(<MyOfferCard offer={withdrawnOffer} request={baseRequest} onWithdrawClick={vi.fn()} />);

    expect(screen.getByText("Withdrawn")).toBeInTheDocument();
    const resubmitLink = screen.getByRole("link", { name: "Resubmit offer" });
    expect(resubmitLink).toHaveAttribute(
      "href",
      `/marketer/offer/create?requestId=${baseRequest.job_request_id}`,
    );
  });
});
