import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { acceptJobOffer, refreshJobOffers, type AcceptOfferResult } from "../offer-actions";
import { acceptedSnapshot, testJob, testOffer } from "../testing/offer-fixtures";
import { JobOffersWorkspace } from "./job-offers-workspace";

vi.mock("../offer-actions", () => ({ acceptJobOffer: vi.fn(), refreshJobOffers: vi.fn() }));
afterEach(cleanup);
beforeEach(() => {
  vi.resetAllMocks();
});

function renderWorkspace(status: "Pending" | "Accepted" = "Pending") {
  return render(
    <JobOffersWorkspace
      initialData={{
        job: { ...testJob, job_status: status },
        offers: {
          status: "success",
          items: status === "Pending" ? [testOffer(), testOffer(102)] : acceptedSnapshot().offers,
        },
      }}
    />,
  );
}

async function chooseMali() {
  fireEvent.click(screen.getByRole("button", { name: "Accept offer from Mali Research" }));
  return screen.findByRole("alertdialog", { name: "Accept this offer?" });
}

describe("creator hiring workspace", () => {
  it("requires confirmation and cancellation does not submit", async () => {
    renderWorkspace();
    const trigger = screen.getByRole("button", { name: "Accept offer from Mali Research" });
    const dialog = await chooseMali();
    expect(within(dialog).getByText("฿2,500.50")).toBeInTheDocument();
    expect(within(dialog).getByText("Nov 15, 2026")).toBeInTheDocument();
    expect(
      within(dialog).getByText(/All other pending offers will be rejected/),
    ).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(acceptJobOffer).not.toHaveBeenCalled();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("prevents duplicate submissions and updates job, competing statuses, and focus after success", async () => {
    let complete!: (result: AcceptOfferResult) => void;
    vi.mocked(acceptJobOffer).mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    renderWorkspace();
    const scrollToFeedback = vi.fn();
    Object.defineProperty(screen.getByRole("heading", { name: "Job offers" }), "scrollIntoView", {
      value: scrollToFeedback,
    });
    const dialog = await chooseMali();
    const confirm = within(dialog).getByRole("button", { name: "Confirm and hire" });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    await waitFor(() => expect(acceptJobOffer).toHaveBeenCalledExactlyOnceWith(12, 101));
    expect(within(dialog).getByRole("button", { name: "Accepting…" })).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeDisabled();
    await act(async () => complete({ status: "accepted", data: acceptedSnapshot() }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(screen.getByText("Mali Research is your selected marketer")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Accepted (1)" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Rejected (1)" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /accept offer from/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Invite marketers" })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("heading", { name: "Job offers" })).toHaveFocus());
    expect(scrollToFeedback).toHaveBeenCalledWith({ block: "start" });
  });

  it("refreshes a withdrawn offer after a conflict and does not claim it was accepted", async () => {
    vi.mocked(acceptJobOffer).mockResolvedValue({
      status: "conflict",
      message: "This offer was withdrawn. Review the latest offers.",
      data: {
        job: testJob,
        offers: [{ ...testOffer(), offer_status: "Withdrawn" }, testOffer(102)],
      },
    });
    renderWorkspace();
    const dialog = await chooseMali();
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm and hire" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("withdrawn"));
    expect(screen.getByRole("tab", { name: "Withdrawn (1)" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Accept offer from Mali Research" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/is your selected marketer/)).not.toBeInTheDocument();
  });

  it("blocks further acceptance after a lost response until a successful read-only refresh", async () => {
    vi.mocked(acceptJobOffer).mockRejectedValue(new Error("connection lost"));
    vi.mocked(refreshJobOffers).mockResolvedValue({ status: "ready", data: acceptedSnapshot() });
    renderWorkspace();
    const dialog = await chooseMali();
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm and hire" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("unknown"));
    expect(screen.queryByRole("button", { name: /accept offer from/i })).not.toBeInTheDocument();
    const refresh = await screen.findByRole("button", { name: "Refresh offers" });
    await waitFor(() => expect(refresh).toBeEnabled());
    fireEvent.click(refresh);
    await waitFor(() =>
      expect(screen.getByText("Mali Research is your selected marketer")).toBeInTheDocument(),
    );
    expect(refreshJobOffers).toHaveBeenCalledExactlyOnceWith(12);
    expect(acceptJobOffer).toHaveBeenCalledTimes(1);
  });

  it("keeps controls unavailable when refreshing also fails", async () => {
    vi.mocked(refreshJobOffers).mockResolvedValue({
      status: "error",
      message: "Your session expired.",
    });
    renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "Refresh offers" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("session expired"));
    expect(screen.queryByRole("button", { name: /accept offer from/i })).not.toBeInTheDocument();
  });

  it("has no acceptance actions for a job that already hired", () => {
    renderWorkspace("Accepted");
    expect(screen.queryByRole("button", { name: /accept offer from/i })).not.toBeInTheDocument();
    expect(screen.getByText("Mali Research is your selected marketer")).toBeInTheDocument();
  });
});
