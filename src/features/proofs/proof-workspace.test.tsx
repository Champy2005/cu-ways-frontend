import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Proof } from "@/features/transactions/types";
import { formatProofTime, sortProofsNewestFirst } from "./format";
import { requestProofCheck, requestProofSave } from "./proof-client";
import { PROOF_SERVER_BOUND_MS } from "./proof-limits";
import { proofMessages, ProofWorkspace } from "./proof-workspace";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("./proof-client", () => ({ requestProofSave: vi.fn(), requestProofCheck: vi.fn() }));

const save = vi.mocked(requestProofSave);
const check = vi.mocked(requestProofCheck);

afterEach(cleanup);
beforeEach(() => {
  vi.resetAllMocks();
});

const proof = (id: number, upload_at: string, url = `https://example.com/proof-${id}`): Proof => ({
  attachment_id: id,
  job_id: 7,
  attachment_type: "Proof",
  url,
  upload_at,
});

function openForm() {
  fireEvent.click(screen.getByRole("button", { name: "Add proof" }));
  return screen.getByRole("dialog");
}

function submitLink(value: string) {
  const dialog = openForm();
  fireEvent.change(within(dialog).getByLabelText("Delivery link"), { target: { value } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Save proof" }));
}

describe("proof formatting", () => {
  it("shows the server time in Bangkok with an ICT suffix", () => {
    expect(formatProofTime("2026-10-28T07:20:00Z")).toBe("28 Oct 2026, 14:20 ICT");
    expect(formatProofTime("not a date")).toBe("Time unavailable");
  });

  it("orders proof newest first", () => {
    const sorted = sortProofsNewestFirst([
      proof(1, "2026-10-28T07:20:00Z"),
      proof(2, "2026-10-29T07:20:00Z"),
      proof(3, "2026-10-27T07:20:00Z"),
    ]);
    expect(sorted.map((row) => row.attachment_id)).toEqual([2, 1, 3]);
  });
});

describe("ProofWorkspace", () => {
  it("starts with an empty state and an Add proof action (A01)", () => {
    render(<ProofWorkspace jobId={7} proofs={[]} canAdd />);
    expect(screen.getByRole("heading", { name: /Saved proof \(0\)/ })).toBeTruthy();
    expect(screen.getByText("No proof added yet")).toBeTruthy();
    expect(screen.getByText("Add your first delivery link.")).toBeTruthy();
  });

  it("hides Add proof unless the job is In Progress", () => {
    render(<ProofWorkspace jobId={7} proofs={[]} canAdd={false} />);
    expect(screen.queryByRole("button", { name: "Add proof" })).toBeNull();
  });

  it("lists full clickable URLs with timestamps, newest first (A06)", () => {
    render(
      <ProofWorkspace
        jobId={7}
        proofs={[proof(1, "2026-10-28T07:20:00Z"), proof(2, "2026-10-29T08:05:00Z")]}
        canAdd
      />,
    );
    const links = within(screen.getByRole("list", { name: "Saved proof links" })).getAllByRole(
      "link",
    );
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "https://example.com/proof-2",
      "https://example.com/proof-1",
    ]);
    expect(links[0].getAttribute("target")).toBe("_blank");
    expect(screen.getByText("29 Oct 2026, 15:05 ICT")).toBeTruthy();
  });

  it("keeps Save disabled for an empty draft and rejects a malformed URL inline (B01)", () => {
    render(<ProofWorkspace jobId={7} proofs={[]} canAdd />);
    const dialog = openForm();
    expect(
      (within(dialog).getByRole("button", { name: "Save proof" }) as HTMLButtonElement).disabled,
    ).toBe(true);

    fireEvent.change(within(dialog).getByLabelText("Delivery link"), {
      target: { value: "example.com/proof" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save proof" }));

    expect(within(dialog).getByText(proofMessages.invalid)).toBeTruthy();
    expect(within(dialog).getByLabelText("Delivery link").getAttribute("aria-invalid")).toBe(
      "true",
    );
    expect(save).not.toHaveBeenCalled();
  });

  it("saves a trimmed proof URL once and refreshes the list (A03, A04)", async () => {
    save.mockResolvedValue({ status: "saved" });
    render(<ProofWorkspace jobId={7} proofs={[]} canAdd />);
    submitLink("  https://example.com/metrics  ");

    await waitFor(() => expect(screen.getByText("Proof saved")).toBeTruthy());
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(7, "https://example.com/metrics");
    expect(refresh).toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("explains a rejection and keeps the draft for recovery (B02)", async () => {
    save.mockResolvedValue({
      status: "error",
      code: "invalid_attachment_type",
      message: "attachment_type must be Proof",
    });
    render(<ProofWorkspace jobId={7} proofs={[]} canAdd />);
    submitLink("https://example.com/metrics");

    await waitFor(() => expect(screen.getByText("Proof wasn’t saved")).toBeTruthy());
    expect(screen.getByText(/The attachment type was rejected\./)).toBeTruthy();
    expect(screen.getByText("Draft link")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add proof" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Reopen proof form" }));
    const dialog = screen.getByRole("dialog");
    expect((within(dialog).getByLabelText("Delivery link") as HTMLInputElement).value).toBe(
      "https://example.com/metrics",
    );
  });

  it("asks to check the saved list when the outcome is unknown (B03)", async () => {
    save.mockResolvedValue({ status: "unknown" });
    check.mockReturnValue(new Promise(() => {}));
    render(<ProofWorkspace jobId={7} proofs={[]} canAdd />);
    submitLink("https://example.com/metrics");

    await waitFor(() => expect(screen.getByText("We couldn’t confirm the save")).toBeTruthy());
    expect(screen.getByText("Unconfirmed link")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add proof" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Check saved proof/ }));
    expect(check).toHaveBeenCalledExactlyOnceWith(7);
    await waitFor(() => expect(screen.getByText("Checking saved proof…")).toBeTruthy());
    // The check is its own request; it never waits on a page refresh behind the save.
    expect(refresh).not.toHaveBeenCalled();
  });

  it("offers a retry once the server can no longer be saving the link (B04)", async () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(1_000);
    save.mockResolvedValue({ status: "unknown" });
    check.mockResolvedValue({ status: "ok", proofs: [] });
    render(<ProofWorkspace jobId={7} proofs={[]} canAdd />);
    submitLink("https://example.com/metrics");
    await waitFor(() => screen.getByRole("button", { name: /Check saved proof/ }));

    now.mockReturnValue(1_000 + PROOF_SERVER_BOUND_MS);
    fireEvent.click(screen.getByRole("button", { name: /Check saved proof/ }));
    await waitFor(() => expect(screen.getByText("This link wasn’t saved")).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Link not saved")).toBeTruthy();
    expect((within(dialog).getByLabelText("Delivery link") as HTMLInputElement).value).toBe(
      "https://example.com/metrics",
    );
    now.mockRestore();
  });

  it("does not offer a retry while the server may still be saving the link", async () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(1_000);
    save.mockResolvedValue({ status: "unknown" });
    check.mockResolvedValue({ status: "ok", proofs: [] });
    render(<ProofWorkspace jobId={7} proofs={[]} canAdd />);
    submitLink("https://example.com/metrics");
    await waitFor(() => screen.getByRole("button", { name: /Check saved proof/ }));

    now.mockReturnValue(1_000 + PROOF_SERVER_BOUND_MS - 1);
    fireEvent.click(screen.getByRole("button", { name: /Check saved proof/ }));
    await waitFor(() => expect(screen.getByText("Not saved yet")).toBeTruthy());
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Add proof" })).toBeNull();
    expect(screen.getByRole("button", { name: /Check again/ })).toBeTruthy();
    now.mockRestore();
  });

  it("confirms the save when the re-read list contains the link", async () => {
    save.mockResolvedValue({ status: "unknown" });
    check.mockResolvedValue({
      status: "ok",
      proofs: [proof(9, "2026-10-28T07:20:00Z", "https://example.com/metrics")],
    });
    render(<ProofWorkspace jobId={7} proofs={[]} canAdd />);
    submitLink("https://example.com/metrics");
    await waitFor(() => screen.getByRole("button", { name: /Check saved proof/ }));

    fireEvent.click(screen.getByRole("button", { name: /Check saved proof/ }));
    await waitFor(() => expect(screen.getByText("Proof saved")).toBeTruthy());
    expect(screen.queryByText("Unconfirmed link")).toBeNull();
    expect(refresh).toHaveBeenCalled();
  });

  it("keeps the outcome unknown when the check itself fails", async () => {
    save.mockResolvedValue({ status: "unknown" });
    check.mockResolvedValue({ status: "error", code: "check_failed", message: "failed" });
    render(<ProofWorkspace jobId={7} proofs={[]} canAdd />);
    submitLink("https://example.com/metrics");
    await waitFor(() => screen.getByRole("button", { name: /Check saved proof/ }));

    fireEvent.click(screen.getByRole("button", { name: /Check saved proof/ }));
    await waitFor(() => expect(screen.getByText("Couldn’t check saved proof")).toBeTruthy());
    expect(screen.getByText("Unconfirmed link")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Check again/ })).toBeTruthy();
  });
});

describe("ProofWorkspace backend errors", () => {
  it("keeps the dialog open with an inline error for invalid_proof_url", async () => {
    save.mockResolvedValue({ status: "error", code: "invalid_proof_url", message: "bad url" });
    render(<ProofWorkspace jobId={7} proofs={[]} canAdd />);
    submitLink("https://example.com/metrics");

    const dialog = await screen.findByRole("dialog");
    await waitFor(() => expect(within(dialog).getByText(proofMessages.invalid)).toBeTruthy());
  });

  it("asks to refresh the job when it is no longer In Progress", async () => {
    save.mockResolvedValue({
      status: "error",
      code: "job_not_in_progress",
      message: "job is not In Progress",
    });
    render(<ProofWorkspace jobId={7} proofs={[]} canAdd />);
    submitLink("https://example.com/metrics");

    await waitFor(() => expect(screen.getByText("This job may have changed")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: /Refresh job/ }));
    expect(refresh).toHaveBeenCalled();
  });

  it("explains lost access without offering a retry", async () => {
    save.mockResolvedValue({ status: "error", code: "forbidden", message: "forbidden" });
    render(<ProofWorkspace jobId={7} proofs={[]} canAdd />);
    submitLink("https://example.com/metrics");

    await waitFor(() => expect(screen.getByText("Job unavailable")).toBeTruthy());
    expect(screen.queryByRole("button", { name: "Reopen proof form" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Add proof" })).toBeNull();
  });

  it("offers sign-in when the session expired", async () => {
    save.mockResolvedValue({ status: "error", code: "session_expired", message: "expired" });
    render(<ProofWorkspace jobId={7} proofs={[]} canAdd />);
    submitLink("https://example.com/metrics");

    await waitFor(() => expect(screen.getByText("Your session expired")).toBeTruthy());
    expect(screen.getByRole("link", { name: "Sign in" }).getAttribute("href")).toBe("/login");
    expect(screen.getByText("Draft link")).toBeTruthy();
  });
});
