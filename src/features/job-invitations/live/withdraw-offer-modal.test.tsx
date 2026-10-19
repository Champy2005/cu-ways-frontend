import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";
import { WithdrawOfferModal } from "./withdraw-offer-modal";
import { savedOffer } from "./test-fixtures";

describe("WithdrawOfferModal", () => {
  afterEach(() => {
    cleanup();
  });
  const baseOffer = {
    ...savedOffer(),
    offer_id: 101,
    offered_price: "1200.00",
    offer_status: "Pending" as const,
  };

  it("renders modal with job title, offered price, and explanation text", () => {
    render(
      <WithdrawOfferModal
        isOpen={true}
        offer={baseOffer}
        jobTitle="Survey on student commuting habits"
        pending={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Withdraw this offer?" })).toBeInTheDocument();
    expect(screen.getByText("Survey on student commuting habits")).toBeInTheDocument();
    expect(screen.getByText("฿1,200")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The creator will no longer be able to accept it. Your offer stays in your history, and you can send a new one if this job is still open.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keep offer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Withdraw" })).toBeInTheDocument();
  });

  it("calls onClose when Keep offer is clicked", () => {
    const handleClose = vi.fn();
    render(
      <WithdrawOfferModal
        isOpen={true}
        offer={baseOffer}
        jobTitle="Survey on student commuting habits"
        pending={false}
        onClose={handleClose}
        onConfirm={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Keep offer" }));
    expect(handleClose).toHaveBeenCalledOnce();
  });

  it("calls onConfirm when Withdraw is clicked", () => {
    const handleConfirm = vi.fn();
    render(
      <WithdrawOfferModal
        isOpen={true}
        offer={baseOffer}
        jobTitle="Survey on student commuting habits"
        pending={false}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));
    expect(handleConfirm).toHaveBeenCalledOnce();
  });

  it("displays error message when provided", () => {
    render(
      <WithdrawOfferModal
        isOpen={true}
        offer={baseOffer}
        jobTitle="Survey on student commuting habits"
        pending={false}
        error="Only a pending offer can be withdrawn."
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Only a pending offer can be withdrawn.");
  });

  it("disables buttons and shows Withdrawing… when pending", () => {
    render(
      <WithdrawOfferModal
        isOpen={true}
        offer={baseOffer}
        jobTitle="Survey on student commuting habits"
        pending={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Keep offer" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Withdrawing…" })).toBeDisabled();
  });

  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <WithdrawOfferModal
        isOpen={false}
        offer={baseOffer}
        jobTitle="Survey on student commuting habits"
        pending={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });
});
