import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { JobPaymentData } from "../api";
import type { ActivePayment } from "../payment";
import type { RecordPaymentResult } from "../payment-actions";
import { requestPaymentRecord, requestPaymentStatus } from "../payment-client";
import { testJob, testOffer } from "../testing/offer-fixtures";
import { JobPaymentPage } from "./job-payment-page";

vi.mock("../payment-client", () => ({
  requestPaymentRecord: vi.fn(),
  requestPaymentStatus: vi.fn(),
}));
afterEach(cleanup);
beforeEach(() => {
  vi.resetAllMocks();
});

const pendingPayment: ActivePayment = {
  payment_id: 4,
  job_id: 12,
  method: "PromptPay",
  amount: "2500.50",
  payment_status: "Pending",
  created_at: "2026-11-06T03:00:00Z",
  paid_at: null,
};

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
        currentPayment: null,
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
    fireEvent.change(screen.getByRole("textbox", { name: /Amount/ }), { target: { value: "" } });
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
    expect(requestPaymentRecord).not.toHaveBeenCalled();

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
    expect(requestPaymentRecord).not.toHaveBeenCalled();
    expect(screen.getByRole("radio", { name: "Bank Transfer" })).toBeChecked();
    expect(screen.getByRole("textbox", { name: /Amount/ })).toHaveValue("2500.5");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Review payment" })).toHaveFocus(),
    );
  });

  it("records once, blocks a second confirm while saving, then shows the read-only record", async () => {
    let finish!: (result: RecordPaymentResult) => void;
    vi.mocked(requestPaymentRecord).mockImplementation(
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
    expect(within(dialog).getByRole("button", { name: "Close" })).toBeEnabled();
    fireEvent.click(saving);
    expect(requestPaymentRecord).toHaveBeenCalledExactlyOnceWith(12, "Bank Transfer", "2500.50");

    finish(recorded);
    expect(await screen.findByRole("heading", { name: "Payment details" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Payment recorded" })).toBeInTheDocument();
    expect(screen.getByText("#9")).toBeInTheDocument();
    expect(screen.getByText("7 Nov 2026, 10:00 (Bangkok)")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("The payment is saved as Paid");
    expect(screen.queryByRole("button", { name: "Review payment" })).not.toBeInTheDocument();
  });

  it("keeps a failed save inside the dialog so the Creator can retry", async () => {
    vi.mocked(requestPaymentRecord)
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
    expect(requestPaymentRecord).toHaveBeenCalledTimes(2);
  });

  it("shows the server mismatch alert on the form and returns focus to the amount", async () => {
    vi.mocked(requestPaymentRecord).mockResolvedValue({
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

  it("shows the saved record on reload instead of an empty form", () => {
    if (recorded.status !== "recorded") throw new Error("fixture");
    renderPage({ currentPayment: recorded.payment });
    expect(screen.getByRole("heading", { name: "Payment details" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Payment recorded" })).toBeInTheDocument();
    expect(screen.getByText("#9")).toBeInTheDocument();
    expect(screen.getByText("Bank Transfer")).toBeInTheDocument();
    expect(screen.getByText("7 Nov 2026, 10:00 (Bangkok)")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Review payment" })).not.toBeInTheDocument();
  });

  it("shows an existing Pending payment as Pending, never as Paid", () => {
    renderPage({ currentPayment: pendingPayment });
    expect(screen.getByRole("heading", { name: "Payment pending" })).toBeInTheDocument();
    expect(screen.getByText("Pending", { selector: "[data-status]" })).toBeInTheDocument();
    expect(screen.queryByText("Paid")).not.toBeInTheDocument();
    expect(screen.getByText("Created on")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Review payment" })).not.toBeInTheDocument();
  });

  it("shows the real status when a submit finds an existing Pending payment", async () => {
    vi.mocked(requestPaymentRecord).mockResolvedValue({
      status: "existing",
      payment: pendingPayment,
      message: "This job already has a payment, so no new payment was created.",
    });
    renderPage();
    fillForm("PromptPay", "2500.50");
    review();
    fireEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Confirm record",
      }),
    );
    expect(await screen.findByRole("heading", { name: "Payment pending" })).toBeInTheDocument();
    expect(screen.getByText(/no new payment was created/)).toBeInTheDocument();
    expect(screen.queryByText("Paid")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Payment details" })).toHaveFocus(),
    );
  });

  it("does not claim Paid when the existing payment cannot be read, and can check again", async () => {
    vi.mocked(requestPaymentRecord).mockResolvedValue({
      status: "existing_unconfirmed",
      message: "This job already has a payment, but its details could not be confirmed.",
    });
    vi.mocked(requestPaymentStatus).mockResolvedValue({ status: "found", payment: pendingPayment });
    renderPage();
    fillForm("PromptPay", "2500.50");
    review();
    fireEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Confirm record",
      }),
    );
    expect(
      await screen.findByRole("heading", { name: "Payment already exists" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Paid")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Review payment" })).not.toBeInTheDocument();

    fireEvent.click(await screen.findByRole("button", { name: "Check payment status" }));
    expect(await screen.findByRole("heading", { name: "Payment pending" })).toBeInTheDocument();
    expect(requestPaymentStatus).toHaveBeenCalledExactlyOnceWith(12);
  });

  it("returns to the form when a status check finds no payment", async () => {
    vi.mocked(requestPaymentRecord).mockResolvedValue({
      status: "unknown",
      message: "We could not confirm whether the payment was saved.",
    });
    vi.mocked(requestPaymentStatus).mockResolvedValue({ status: "none" });
    renderPage();
    fillForm("Credit Card", "2500.50");
    review();
    fireEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Confirm record",
      }),
    );
    expect(
      await screen.findByRole("heading", { name: "Payment status unknown" }),
    ).toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: "Check payment status" }));
    expect(await screen.findByText(/No payment is recorded/)).toHaveAttribute("role", "alert");
    expect(screen.getByRole("radio", { name: "Credit Card" })).toBeChecked();
    expect(screen.getByRole("textbox", { name: /Amount/ })).toHaveValue("2500.50");
  });

  it("lets the Creator close the dialog while saving without allowing a second submit", async () => {
    let finish!: (result: RecordPaymentResult) => void;
    vi.mocked(requestPaymentRecord).mockImplementation(
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
    expect(await within(dialog).findByText(/Closing does not cancel it/)).toBeInTheDocument();

    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(screen.getByRole("status")).toHaveTextContent("Still recording this payment");
    const reviewButton = screen.getByRole("button", { name: "Recording…" });
    expect(reviewButton).toHaveAttribute("aria-disabled", "true");
    await waitFor(() => expect(reviewButton).toHaveFocus());

    fireEvent.click(reviewButton);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(requestPaymentRecord).toHaveBeenCalledTimes(1);

    finish(recorded);
    expect(await screen.findByRole("heading", { name: "Payment recorded" })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Payment details" })).toHaveFocus(),
    );
  });

  it("shows a failure on the form when it lands after the dialog was closed", async () => {
    let finish!: (result: RecordPaymentResult) => void;
    vi.mocked(requestPaymentRecord).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    renderPage();
    fillForm("PromptPay", "2500.50");
    review();
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm record" }));
    fireEvent.click(await within(dialog).findByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());

    finish({ status: "error", message: "The payment was not recorded. Try again." });
    expect(await screen.findByRole("alert")).toHaveTextContent("The payment was not recorded");
    expect(await screen.findByRole("button", { name: "Review payment" })).not.toHaveAttribute(
      "aria-disabled",
    );
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

  describe("recovery after a save with an unknown result", () => {
    async function confirmPayment() {
      fillForm("Bank Transfer", "2500.50");
      review();
      fireEvent.click(
        within(await screen.findByRole("alertdialog")).getByRole("button", {
          name: "Confirm record",
        }),
      );
    }

    const unknown: RecordPaymentResult = {
      status: "unknown",
      message: "We could not confirm whether the payment was saved.",
    };

    it("leaves the status check ready to use without the Creator pressing it", async () => {
      // The reported bug: after a timed-out save the check showed "Checking…"
      // and stayed disabled, because the save and the check shared one pending state.
      vi.mocked(requestPaymentRecord).mockResolvedValue(unknown);
      vi.mocked(requestPaymentStatus).mockResolvedValue({
        status: "found",
        payment: pendingPayment,
      });
      renderPage();
      await confirmPayment();

      expect(await screen.findByRole("heading", { name: "Payment status unknown" })).toBeVisible();
      const check = await screen.findByRole("button", { name: "Check payment status" });
      expect(check).toBeEnabled();
      expect(screen.queryByRole("button", { name: "Checking…" })).not.toBeInTheDocument();
      // No resubmit until the real status is known.
      expect(screen.queryByRole("button", { name: /Review payment|Recording/ })).toBeNull();

      fireEvent.click(check);
      expect(await screen.findByRole("heading", { name: "Payment pending" })).toBeVisible();
      expect(requestPaymentStatus).toHaveBeenCalledExactlyOnceWith(12);
      expect(requestPaymentRecord).toHaveBeenCalledTimes(1);
    });

    it("shows Checking… only while a check runs, then allows a retry", async () => {
      let finishCheck!: (result: Awaited<ReturnType<typeof requestPaymentStatus>>) => void;
      vi.mocked(requestPaymentRecord).mockResolvedValue(unknown);
      vi.mocked(requestPaymentStatus)
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              finishCheck = resolve;
            }),
        )
        .mockResolvedValueOnce({ status: "found", payment: pendingPayment });
      renderPage();
      await confirmPayment();
      fireEvent.click(await screen.findByRole("button", { name: "Check payment status" }));
      expect(await screen.findByRole("button", { name: "Checking…" })).toBeDisabled();

      finishCheck({ status: "error", message: "The payment status could not be checked." });
      expect(await screen.findByText(/status could not be checked/)).toBeVisible();
      const retry = await screen.findByRole("button", { name: "Check payment status" });
      expect(retry).toBeEnabled();
      expect(screen.getAllByRole("link", { name: "Back to job details" })).not.toHaveLength(0);
      fireEvent.click(retry);
      expect(await screen.findByRole("heading", { name: "Payment pending" })).toBeVisible();
    });

    it("keeps the draft when the check finds no payment", async () => {
      vi.mocked(requestPaymentRecord).mockResolvedValue(unknown);
      vi.mocked(requestPaymentStatus).mockResolvedValue({ status: "none" });
      renderPage();
      await confirmPayment();
      fireEvent.click(await screen.findByRole("button", { name: "Check payment status" }));
      expect(await screen.findByText(/No payment is recorded for this job yet/)).toBeVisible();
      expect(screen.getByRole("radio", { name: "Bank Transfer" })).toBeChecked();
      expect(screen.getByRole("textbox", { name: /Amount/ })).toHaveValue("2500.50");
      expect(await screen.findByRole("button", { name: "Review payment" })).not.toHaveAttribute(
        "aria-disabled",
      );
    });
  });
});
