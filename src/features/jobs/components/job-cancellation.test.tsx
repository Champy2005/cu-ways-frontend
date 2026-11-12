import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StrictMode } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { cancelCreatorJob, loadCancellationDetails } from "../cancellation-actions";
import {
  cancellationCheckKey,
  type CancellationDetails,
  type CancellationResult,
} from "../cancellation";
import { JobCancellation } from "./job-cancellation";

vi.mock("../cancellation-actions", () => ({
  cancelCreatorJob: vi.fn(),
  loadCancellationDetails: vi.fn(),
}));

const details: CancellationDetails = {
  jobId: 41,
  title: "Campus dining",
  status: "Pending",
  paid: false,
  activeRequests: 2,
  pendingOffers: 3,
  cancelledAt: null,
  reason: null,
};
const reload = vi.fn();
const mount = () => render(<JobCancellation jobId="41" creatorId={4} />);
async function openDialog() {
  fireEvent.click(await screen.findByRole("button", { name: "Cancel job" }));
  return screen.findByRole("dialog");
}

beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
  vi.stubGlobal("location", { ...window.location, reload });
  vi.mocked(loadCancellationDetails).mockResolvedValue({ status: "ready", details });
  vi.mocked(cancelCreatorJob).mockResolvedValue({
    status: "cancelled",
    details: { ...details, status: "Cancelled", activeRequests: 0, pendingOffers: 0 },
  });
});
afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Creator cancellation section", () => {
  it.each(["Accepted", "In Progress", "Completed"] as const)(
    "does not fetch cancellation details for a known %s job",
    (status) => {
      const view = render(<JobCancellation jobId="41" creatorId={4} status={status} />);
      expect(view.container).toBeEmptyDOMElement();
      expect(loadCancellationDetails).not.toHaveBeenCalled();
    },
  );

  it("preserves post-reload success in StrictMode even while details never resolve", async () => {
    const successKey = `${cancellationCheckKey(4, "41")}:success`;
    sessionStorage.setItem(successKey, "1");
    vi.mocked(loadCancellationDetails).mockImplementation(() => new Promise(() => {}));
    render(
      <StrictMode>
        <JobCancellation jobId="41" creatorId={4} status="Cancelled" />
      </StrictMode>,
    );
    expect(await screen.findByText("Job cancelled")).toBeVisible();
    expect(sessionStorage.getItem(successKey)).toBeNull();
    expect(screen.getByText(/Loading cancellation details/)).toBeVisible();
  });

  it("shows cancellation success even when the post-reload details request rejects", async () => {
    sessionStorage.setItem(`${cancellationCheckKey(4, "41")}:success`, "1");
    vi.mocked(loadCancellationDetails).mockRejectedValue(new Error("offline"));
    mount();
    expect(await screen.findByText("Job cancelled")).toBeVisible();
    expect(await screen.findByText(/Cancellation details could not be loaded/)).toBeVisible();
  });

  it("shows effects and counts, and Keep job performs no mutation", async () => {
    mount();
    const dialog = await openDialog();
    expect(within(dialog).getByText("Requests to close")).toBeInTheDocument();
    expect(within(dialog).getByText("Offers to reject")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Keep job" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(cancelCreatorJob).not.toHaveBeenCalled();
  });

  it("submits once, confirms Cancelled, and reloads existing job components", async () => {
    mount();
    const dialog = await openDialog();
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm cancellation" }));
    await screen.findByText("This job has been cancelled. Its contract and history are retained.");
    expect(cancelCreatorJob).toHaveBeenCalledExactlyOnceWith("41", 4);
    expect(reload).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: "Cancel job" })).not.toBeInTheDocument();
  });

  it("allows closing and reopening a pending operation without another POST", async () => {
    let resolve!: (value: CancellationResult) => void;
    vi.mocked(cancelCreatorJob).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    mount();
    fireEvent.click(
      within(await openDialog()).getByRole("button", { name: "Confirm cancellation" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Continue browsing" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "View progress" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirm cancellation" })).not.toBeInTheDocument();
    expect(cancelCreatorJob).toHaveBeenCalledTimes(1);
    await act(async () => resolve({ status: "unknown", message: "Check the current job." }));
    expect(await screen.findByRole("button", { name: "Check current job" })).toBeInTheDocument();
  });

  it.each([
    { ...details, paid: true },
    { ...details, status: "Completed" as const },
    { ...details, status: "Cancelled" as const },
    { ...details, status: "Accepted" as const },
    { ...details, status: "In Progress" as const },
  ])("does not enable cancellation for $status, paid=$paid", async (snapshot) => {
    vi.mocked(loadCancellationDetails).mockResolvedValue({ status: "ready", details: snapshot });
    mount();
    await screen.findByText("Contract summary");
    expect(screen.queryByRole("button", { name: "Cancel job" })).not.toBeInTheDocument();
    expect(cancelCreatorJob).not.toHaveBeenCalled();
  });

  it("requires an explicit fresh check on document return without resubmitting", async () => {
    sessionStorage.setItem(cancellationCheckKey(4, "41"), "1");
    mount();
    fireEvent.click(await screen.findByRole("button", { name: "Check current job" }));
    await screen.findByRole("button", { name: "Cancel job" });
    expect(loadCancellationDetails).toHaveBeenCalledTimes(2);
    expect(cancelCreatorJob).not.toHaveBeenCalled();
  });

  it("clears private contract data when access is removed", async () => {
    mount();
    await screen.findByText("Contract summary");
    vi.mocked(loadCancellationDetails).mockResolvedValue({
      status: "unavailable",
      message: "Access removed.",
    });
    fireEvent.click(screen.getByRole("button", { name: "Refresh cancellation details" }));
    await screen.findByText("Access removed.");
    expect(screen.queryByText("Contract summary")).not.toBeInTheDocument();
    expect(screen.queryByText(/Campus dining/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel job" })).not.toBeInTheDocument();
  });

  it("keeps a timed-out operation uncertain, even if a read still sees Pending", async () => {
    let resolve!: (value: CancellationResult) => void;
    vi.mocked(cancelCreatorJob).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    mount();
    const dialog = await openDialog();
    vi.useFakeTimers();
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm cancellation" }));
    await act(async () => vi.advanceTimersByTime(12_000));
    fireEvent.click(screen.getByRole("button", { name: "Check current job" }));
    await act(async () => {});
    expect(screen.queryByRole("button", { name: "Cancel job" })).not.toBeInTheDocument();
    expect(cancelCreatorJob).toHaveBeenCalledTimes(1);
    await act(async () => resolve({ status: "unknown", message: "Check current state." }));
  });
});
