import { beforeEach, describe, expect, it, vi } from "vitest";
import { serverApiGet } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import type { components } from "@/lib/api/generated/backend";
import { getCompletionEvidence } from "./completion-api";

vi.mock("@/lib/api/server-client", () => ({ serverApiGet: vi.fn() }));

const saved: components["schemas"]["JobSettlement"] = {
  job_id: 41,
  job_title: "Campus dining survey",
  job_status: "In Progress",
  creator: { user_id: 4, name: "Narin C." },
  marketer: { user_id: 7, name: "Mali S." },
  accepted_price: "2500.00",
  payout_status: "Held",
  completed_at: null,
  payment: {
    payment_id: 12,
    job_id: 41,
    method: "PromptPay",
    amount: "2500.00",
    payment_status: "Paid",
    created_at: null,
    paid_at: null,
  },
};
const proof = {
  attachment_id: 3,
  job_id: 41,
  attachment_type: "Proof",
  url: "https://example.com/delivery",
  upload_at: "2026-11-12T07:20:00Z",
};

beforeEach(() => vi.resetAllMocks());

describe("US027 completion evidence", () => {
  it("uses saved Proof attachments and the paid agreed amount", async () => {
    vi.mocked(serverApiGet).mockResolvedValue([proof]);
    await expect(getCompletionEvidence(saved)).resolves.toMatchObject({
      status: "ready",
      proofs: [{ id: 3 }],
      paid: true,
      acceptedOffer: true,
    });
    expect(serverApiGet).toHaveBeenCalledWith(
      "/api/v1/jobs/41/proofs",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("never counts Brief or Other attachments as delivery proof", async () => {
    vi.mocked(serverApiGet).mockResolvedValue([
      { ...proof, attachment_type: "Brief" },
      { ...proof, attachment_id: 4, attachment_type: "Other" },
    ]);
    await expect(getCompletionEvidence(saved)).resolves.toMatchObject({
      status: "ready",
      proofs: [],
    });
  });

  it("does not accept a proof belonging to another job", async () => {
    vi.mocked(serverApiGet).mockResolvedValue([{ ...proof, job_id: 99 }]);
    await expect(getCompletionEvidence(saved)).resolves.toEqual({ status: "error" });
  });

  it("distinguishes an unavailable proof read from zero saved proofs", async () => {
    vi.mocked(serverApiGet).mockRejectedValue(new Error("Offline"));
    await expect(getCompletionEvidence(saved)).resolves.toEqual({ status: "error" });
  });

  it.each([401, 403, 404])("propagates %s so the page removes private details", async (status) => {
    vi.mocked(serverApiGet).mockRejectedValue(new ApiError(status, "forbidden", "Unavailable"));
    await expect(getCompletionEvidence(saved)).rejects.toMatchObject({ status });
  });

  it("requires a Paid payment for the agreed amount, as well as proof", async () => {
    vi.mocked(serverApiGet).mockResolvedValue([proof]);
    await expect(getCompletionEvidence({ ...saved, payment: null })).resolves.toMatchObject({
      status: "ready",
      paid: false,
    });
    await expect(
      getCompletionEvidence({ ...saved, payment: { ...saved.payment!, amount: "100.00" } }),
    ).resolves.toMatchObject({ status: "ready", paid: false });
  });
});
