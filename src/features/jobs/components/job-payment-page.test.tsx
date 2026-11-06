import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { JobPaymentData } from "../api";
import { recordJobPayment, type RecordPaymentResult } from "../payment-actions";
import { testJob, testOffer } from "../testing/offer-fixtures";
import { JobPaymentPage } from "./job-payment-page";

vi.mock("../payment-actions", () => ({ recordJobPayment: vi.fn() }));
afterEach(cleanup);
beforeEach(() => {
  vi.resetAllMocks();
});

const recorded: RecordPaymentResult = {
  status: "recorded",
  payment: {
    payment_id: 9,
    job_id: 12,
    method: "Bank Transfer",
    amount: "2500.50",
    payment_status: "Paid",
    created_at: "2026-11-07T03:00:00Z",
    paid_at: "2026-11-07T03:00:00Z",
  },
};

function renderPage(overrides: Partial<JobPaymentData> = {}) {
  return render(
    <JobPaymentPage
      data={{
        job: { ...testJob, title: "Campus mobility study", job_status: "Accepted" },
        acceptedOffer: { ...testOffer(), offer_status: "Accepted" },
        ...overrides,
      }}
    />,
  );
}

function fillForm(method: string, amount: string) {
  fireEvent.click(screen.getByRole("radio", { name: method }));
  fireEvent.change(screen.getByRole("textbox", { name: /Amount/ }), {
    target: { value: amount },
  });
}

function review() {
  fireEvent.click(screen.getByRole("button", { name: "Review payment" }));
}

describe("creator payment page", () => {
  it("shows the job, the hired marketer and the accepted price with no method preselected", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "Record payment" })).toBeInTheDocument();
    expect(screen.getByText("Mali Research")).toBeInTheDocument();
    expect(screen.getByText("฿2,500.50")).toBeInTheDocument();
    for (const method of ["PromptPay", "Bank Transfer", "Credit Card"]) {
      expect(screen.getByRole("radio", { name: method })).not.toBeChecked();
    }
    expect(screen.getByText(/No money is collected or transferred/)).toBeInTheDocument();
  });

  it("blocks review with inline errors and focuses the first invalid field", () => {
    renderPage();
    review();
    expect(screen.getByText("Choose a payment method.")).toBeInTheDocument();
    expect(screen.getByText("Enter the payment amount.")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "PromptPay" })).toHaveFocus();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "PromptPay" }));
    expect(screen.queryByText("Choose a payment method.")).not.toBeInTheDocument();
    review();
    expect(screen.getByRole("textbox", { name: /Amount/ })).toHaveFocus();
  });

  it("blocks a mismatched amount until the exact price is entered", () => {
    renderPage();
    fillForm("PromptPay", "2500");
    review();
    const amount = screen.getByRole("textbox", { name: /Amount/ });
    expect(amount).toHaveAttribute("aria-invalid", "true");
    expect(amount).toHaveAccessibleDescription(
      expect.stringContaining("The amount must be exactly ฿2,500.50"),
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(recordJobPayment).not.toHaveBeenCalled();

    fireEvent.change(amount, { target: { value: "2500.50" } });
    expect(amount).not.toHaveAttribute("aria-invalid");
  });

  it("confirms the summary, and Go back keeps the entered values without saving", async () => {
    renderPage();
    fillForm("Bank Transfer", "2500.5");
    review();
    const dialog = await screen.findByRole("alertdialog", { name: "Record this payment?" });
    expect(within(dialog).getByText("Mali Research")).toBeInTheDocument();
    expect(within(dialog).getByText("Bank Transfer")).toBeInTheDocument();
    expect(within(dialog).getByText("฿2,500.50")).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Go back" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(recordJobPayment).not.toHaveBeenCalled();
    expect(screen.getByRole("radio", { name: "Bank Transfer" })).toBeChecked();
    expect(screen.getByRole("textbox", { name: /Amount/ })).toHaveValue("2500.5");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Review payment" })).toHaveFocus(),
    );
  });

  it("records once, disables the dialog while saving, then shows the read-only record", async () => {
    let finish!: (result: RecordPaymentResult) => void;
    vi.mocked(recordJobPayment).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    renderPage();
    fillForm("Bank Transfer", "2500.50");
    review();
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm record" }));

    const saving = await within(dialog).findByRole("button", { name: "Recording…" });
    expect(saving).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "Go back" })).toBeDisabled();
    fireEvent.click(saving);
    expect(recordJobPayment).toHaveBeenCalledExactlyOnceWith(12, "Bank Transfer", "2500.50");

    finish(recorded);
    expect(await screen.findByRole("heading", { name: "Payment details" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Payment recorded" })).toBeInTheDocument();
    expect(screen.getByText("#9")).toBeInTheDocument();
    expect(screen.getByText("7 Nov 2026, 10:00 (Bangkok)")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("The payment is saved as Paid");
    expect(screen.queryByRole("button", { name: "Review payment" })).not.toBeInTheDocument();
  });

  it("keeps a failed save inside the dialog so the Creator can retry", async () => {
    vi.mocked(recordJobPayment)
      .mockResolvedValueOnce({ status: "error", message: "The payment could not be recorded." })
      .mockResolvedValueOnce(recorded);
    renderPage();
    fillForm("Bank Transfer", "2500.50");
    review();
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm record" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "The payment could not be recorded.",
    );
    fireEvent.click(await within(dialog).findByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "Payment details" })).toBeInTheDocument();
    expect(recordJobPayment).toHaveBeenCalledTimes(2);
  });

  it("shows the server mismatch alert on the form and returns focus to the amount", async () => {
    vi.mocked(recordJobPayment).mockResolvedValue({
      status: "mismatch",
      message: "The amount does not match the accepted offer price.",
    });
    renderPage();
    fillForm("PromptPay", "2500.50");
    review();
    fireEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Confirm record",
      }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The amount does not match the accepted offer price.",
    );
    await waitFor(() => expect(screen.getByRole("textbox", { name: /Amount/ })).toHaveFocus());
    expect(screen.getByRole("textbox", { name: /Amount/ })).toHaveAttribute("aria-invalid", "true");
  });

  it("turns a duplicate attempt into an already-recorded state", async () => {
    vi.mocked(recordJobPayment).mockResolvedValue({
      status: "already_recorded",
      message: "A payment has already been recorded for this job.",
    });
    renderPage();
    fillForm("PromptPay", "2500.50");
    review();
    fireEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Confirm record",
      }),
    );
    expect(
      await screen.findByRole("heading", { name: "Payment already recorded" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Review payment" })).not.toBeInTheDocument();
  });

  it.each([
    [{ acceptedOffer: null }, /no accepted offer/],
    [{ job: { ...testJob, job_status: "Pending" as const } }, /accepted offer is required/],
    [{ job: { ...testJob, job_status: "Cancelled" as const } }, /was cancelled/],
  ])("hides the form when payment is unavailable", (overrides, message) => {
    renderPage(overrides);
    expect(screen.getByText("Payment is not available")).toBeInTheDocument();
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Review payment" })).not.toBeInTheDocument();
  });
});
