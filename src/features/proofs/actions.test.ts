import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { serverApiRequest } from "@/lib/api/server-client";
import { getSession } from "@/lib/auth/session";
import { getProofs } from "@/features/transactions/queries";
import { saveProof } from "./actions";
import { describeProofError } from "./errors";

vi.mock("@/lib/api/server-client", () => ({ serverApiRequest: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn() }));
vi.mock("@/features/transactions/queries", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/transactions/queries")>()),
  getProofs: vi.fn(),
}));

const request = vi.mocked(serverApiRequest);
const session = vi.mocked(getSession);
const proofs = vi.mocked(getProofs);
const url = "https://example.com/metrics";
const savedProof = {
  attachment_id: 1,
  job_id: 7,
  attachment_type: "Proof" as const,
  url,
  upload_at: "2026-10-28T07:20:00Z",
};

beforeEach(() => {
  vi.resetAllMocks();
  session.mockResolvedValue({ userId: 3, token: "t" } as Awaited<ReturnType<typeof getSession>>);
});

describe("saveProof", () => {
  it("posts a trimmed Proof attachment", async () => {
    request.mockResolvedValue({});
    await expect(saveProof("7", `  ${url}  `)).resolves.toEqual({ status: "saved" });
    expect(request).toHaveBeenCalledWith("/api/v1/jobs/7/proofs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, attachment_type: "Proof" }),
    });
  });

  it("returns the backend code for a definitive rejection", async () => {
    request.mockRejectedValue(new ApiError(422, "invalid_attachment_type", "must be Proof"));
    await expect(saveProof("7", url)).resolves.toEqual({
      status: "error",
      code: "invalid_attachment_type",
      message: "must be Proof",
    });
    expect(proofs).not.toHaveBeenCalled();
  });

  it("reports a 409 job state conflict without retrying", async () => {
    request.mockRejectedValue(new ApiError(409, "job_not_in_progress", "not in progress"));
    const result = await saveProof("7", url);
    expect(result).toMatchObject({ status: "error", code: "job_not_in_progress" });
  });

  it("reconciles a lost response against the saved list", async () => {
    request.mockRejectedValue(new TypeError("fetch failed"));
    proofs.mockResolvedValue([savedProof]);
    await expect(saveProof("7", url)).resolves.toEqual({ status: "saved" });
  });

  it("reports not saved when the re-read list lacks the link", async () => {
    request.mockRejectedValue(new ApiError(503, "unavailable", "down"));
    proofs.mockResolvedValue([]);
    await expect(saveProof("7", url)).resolves.toMatchObject({
      status: "error",
      code: "server_error",
    });
  });

  it("stays unknown when the list cannot be read either", async () => {
    request.mockRejectedValue(new TypeError("fetch failed"));
    proofs.mockRejectedValue(new TypeError("fetch failed"));
    await expect(saveProof("7", url)).resolves.toEqual({ status: "unknown" });
  });

  it("rejects malformed links and expired sessions before calling the backend", async () => {
    await expect(saveProof("7", "example.com")).resolves.toMatchObject({
      code: "invalid_proof_url",
    });
    session.mockResolvedValue(null);
    await expect(saveProof("7", url)).resolves.toMatchObject({ code: "session_expired" });
    expect(request).not.toHaveBeenCalled();
  });
});

describe("describeProofError", () => {
  it.each([
    ["invalid_proof_url", "field"],
    ["invalid_attachment_type", "rejected"],
    ["validation_error", "rejected"],
    ["job_not_in_progress", "job-changed"],
    ["accepted_offer_mismatch", "job-changed"],
    ["forbidden", "access"],
    ["marketer_required", "access"],
    ["job_not_found", "access"],
    ["session_expired", "session"],
    ["something_new", "rejected"],
  ])("maps %s to %s", (code, kind) => {
    expect(describeProofError(code).kind).toBe(kind);
  });
});
