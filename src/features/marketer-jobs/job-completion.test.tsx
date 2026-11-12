import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JobDetail } from "./job-detail";
import { JobsWorkspace } from "./jobs-workspace";
import { loadHiredJob, startHiredJob } from "./actions";
import type { HiredJob } from "./types";

vi.mock("./actions", () => ({ loadHiredJob: vi.fn(), startHiredJob: vi.fn() }));

const job: HiredJob = {
  id: 41,
  status: "In Progress",
  surveys: [{ id: 12, title: "Campus dining survey" }],
  creator: "Narin C.",
  price: "2500.00",
  deliveryDate: null,
  deadline: null,
  targetResponses: null,
  briefUrl: null,
  completion: {
    status: "ready",
    proofs: [],
    acceptedOffer: true,
    paid: true,
    marketer: "Mali S.",
    completedAt: null,
  },
};

function withProof(): HiredJob {
  return {
    ...job,
    completion: {
      status: "ready",
      proofs: [{ id: 3, url: "https://example.com/delivery", savedAt: "2026-11-12T07:20:00Z" }],
      acceptedOffer: true,
      paid: true,
      marketer: "Mali S.",
      completedAt: null,
    },
  };
}

function show(record = job) {
  return render(
    <JobsWorkspace>
      <JobDetail
        id="41"
        initial={{ status: "success", data: record }}
        backHref="/marketer/jobs?status=active&page=1"
      />
    </JobsWorkspace>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
  vi.mocked(loadHiredJob).mockResolvedValue({ status: "success", data: job });
});
afterEach(cleanup);

describe("US027 on the Marketer job detail route", () => {
  it("shows missing proof without completing or restarting an In Progress job", async () => {
    show();
    expect(screen.getByRole("heading", { name: "Job completion" })).toBeVisible();
    expect(screen.getByText("3 of 4 requirements met")).toBeVisible();
    expect(screen.getByText("No proof added yet")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Start job" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Run completion check" }));
    const dialog = await screen.findByRole("dialog", { name: "Requirements incomplete" });
    expect(within(dialog).getByText(/Add delivery proof/)).toBeVisible();
    expect(screen.getByText("In Progress", { selector: ".workspace-status" })).toBeVisible();
    expect(startHiredJob).not.toHaveBeenCalled();
    expect(loadHiredJob).toHaveBeenCalledExactlyOnceWith("41");
    fireEvent.click(within(dialog).getByRole("button", { name: "Got it" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("shows saved evidence and reports readiness without giving the Marketer a completion mutation", async () => {
    const ready = withProof();
    vi.mocked(loadHiredJob).mockResolvedValue({ status: "success", data: ready });
    show(ready);
    expect(screen.getByText("4 of 4 requirements met")).toBeVisible();
    const link = screen.getByRole("link", { name: /https:\/\/example.com\/delivery/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText(/12 Nov 2026, 14:20 ICT/)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Run completion check" }));
    const dialog = await screen.findByRole("dialog", { name: "Ready for creator sign-off" });
    expect(within(dialog).getByText(/The Creator can complete this job/)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Confirm completion" })).not.toBeInTheDocument();
    expect(startHiredJob).not.toHaveBeenCalled();
  });

  it("uses a fresh proof read instead of approving a stale checklist", async () => {
    show(withProof());
    fireEvent.click(screen.getByRole("button", { name: "Run completion check" }));
    await screen.findByRole("dialog", { name: "Requirements incomplete" });
    expect(screen.getByText("No proof added yet")).toBeVisible();
    expect(screen.getByText("3 of 4 requirements met")).toBeVisible();
  });

  it("does not treat proof alone as permission to complete when payment is missing", async () => {
    const unpaid = withProof();
    if (unpaid.completion?.status === "ready") unpaid.completion.paid = false;
    vi.mocked(loadHiredJob).mockResolvedValue({ status: "success", data: unpaid });
    show(unpaid);
    fireEvent.click(screen.getByRole("button", { name: "Run completion check" }));
    const dialog = await screen.findByRole("dialog", { name: "Requirements incomplete" });
    expect(within(dialog).getByText("Payment must be Paid for the agreed amount.")).toBeVisible();
  });

  it("shows Completed and its saved completion time as read-only", () => {
    const completed = withProof();
    completed.status = "Completed";
    if (completed.completion?.status === "ready")
      completed.completion.completedAt = "2026-11-12T08:00:00Z";
    show(completed);
    expect(screen.getByText("Job completed")).toBeVisible();
    expect(screen.getByText("Completed", { selector: ".workspace-status" })).toBeVisible();
    expect(screen.getByText("12 Nov 2026, 15:00 ICT")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Run completion check" })).not.toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Delivery proof attachments" })).toBeVisible();
  });

  it("shows a read failure rather than inventing missing or satisfied requirements", () => {
    show({ ...job, completion: { status: "error" } });
    expect(
      screen.getByRole("heading", { name: "Completion requirements unavailable" }),
    ).toBeVisible();
    expect(screen.queryByText(/of 4 requirements met/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Run completion check" })).not.toBeInTheDocument();
  });

  it("clears the job summary and delivery data when read access is removed", async () => {
    vi.mocked(loadHiredJob).mockResolvedValue({ status: "unavailable" });
    show(withProof());
    fireEvent.click(screen.getByRole("button", { name: "Run completion check" }));
    await screen.findByRole("heading", { name: "Job unavailable" });
    expect(screen.queryByText("Narin C.")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("list", { name: "Delivery proof attachments" }),
    ).not.toBeInTheDocument();
  });

  it("keeps Accepted jobs on the existing US025 layout", () => {
    show({ ...job, status: "Accepted", completion: undefined });
    expect(screen.getByRole("heading", { name: "Job #41" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Contract" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Start job" })).toBeEnabled();
    expect(screen.queryByText("Completion requirements")).not.toBeInTheDocument();
  });
});
