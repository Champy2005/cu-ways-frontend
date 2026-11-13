import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { serverApiGet, serverApiRequest } from "@/lib/api/server-client";
import { getSession } from "@/lib/auth/session";
import { describeProofError } from "./errors";
import { checkJobProofs, saveJobProof } from "./proof-actions";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/api/server-client", () => ({ serverApiRequest: vi.fn(), serverApiGet: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn() }));

const request = vi.mocked(serverApiRequest);
const read = vi.mocked(serverApiGet);
const session = vi.mocked(getSession);
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

describe("saveJobProof", () => {
  it("posts a trimmed Proof attachment with a bounded backend call", async () => {
    request.mockResolvedValue({});
    await expect(saveJobProof(7, `  ${url}  `)).resolves.toEqual({ status: "saved" });
    const [path, init] = request.mock.calls[0];
    expect(path).toBe("/api/v1/jobs/7/proofs");
    expect(init?.body).toBe(JSON.stringify({ url, attachment_type: "Proof" }));
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("returns the backend code for a definitive 4xx refusal", async () => {
    request.mockRejectedValue(new ApiError(422, "invalid_attachment_type", "must be Proof"));
    await expect(saveJobProof(7, url)).resolves.toEqual({
      status: "error",
      code: "invalid_attachment_type",
      message: "must be Proof",
    });
    expect(read).not.toHaveBeenCalled();
  });

  it("reports a 409 job state conflict without reading the list", async () => {
    request.mockRejectedValue(new ApiError(409, "job_not_in_progress", "not in progress"));
    await expect(saveJobProof(7, url)).resolves.toMatchObject({ code: "job_not_in_progress" });
    expect(read).not.toHaveBeenCalled();
  });

  it("confirms a lost response when the re-read list has the link", async () => {
    request.mockRejectedValue(new TypeError("fetch failed"));
    read.mockResolvedValue([savedProof]);
    await expect(saveJobProof(7, url)).resolves.toEqual({ status: "saved" });
  });

  it.each([
    ["a network error", new TypeError("fetch failed")],
    ["a timeout", new DOMException("The operation timed out.", "TimeoutError")],
    ["a server error", new ApiError(503, "unavailable", "down")],
  ])("keeps %s unknown when the link is not in the list yet", async (_name, error) => {
    request.mockRejectedValue(error);
    read.mockResolvedValue([]);
    await expect(saveJobProof(7, url)).resolves.toEqual({ status: "unknown" });
  });

  it("stays unknown when the list cannot be read either", async () => {
    request.mockRejectedValue(new TypeError("fetch failed"));
    read.mockRejectedValue(new TypeError("fetch failed"));
    await expect(saveJobProof(7, url)).resolves.toEqual({ status: "unknown" });
  });

  it("rejects malformed input and expired sessions before calling the backend", async () => {
    await expect(saveJobProof(7, "example.com")).resolves.toMatchObject({
      code: "invalid_proof_url",
    });
    await expect(saveJobProof(0, url)).resolves.toMatchObject({ code: "job_not_found" });
    await expect(saveJobProof(7, 42)).resolves.toMatchObject({ code: "invalid_proof_url" });
    session.mockResolvedValue(null);
    await expect(saveJobProof(7, url)).resolves.toMatchObject({ code: "session_expired" });
    expect(request).not.toHaveBeenCalled();
  });
});

describe("checkJobProofs", () => {
  it("returns the saved list from a bounded read", async () => {
    read.mockResolvedValue([savedProof]);
    await expect(checkJobProofs(7)).resolves.toEqual({ status: "ok", proofs: [savedProof] });
    expect(read.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it("passes on access refusals and reports other failures as check_failed", async () => {
    read.mockRejectedValueOnce(new ApiError(403, "forbidden", "no access"));
    await expect(checkJobProofs(7)).resolves.toMatchObject({ code: "forbidden" });
    read.mockRejectedValueOnce(new TypeError("fetch failed"));
    await expect(checkJobProofs(7)).resolves.toMatchObject({ code: "check_failed" });
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
