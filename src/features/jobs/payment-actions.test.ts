import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { ApiError } from "@/lib/api/errors";
import { serverApiRequest } from "@/lib/api/server-client";
import { recordJobPayment } from "./payment-actions";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/api/server-client", () => ({ serverApiRequest: vi.fn() }));

const payment = {
  payment_id: 9,
  job_id: 12,
  method: "PromptPay" as const,
  amount: "2500.50",
  payment_status: "Paid" as const,
  created_at: "2026-11-07T03:00:00Z",
  paid_at: "2026-11-07T03:00:00Z",
};

describe("recordJobPayment", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getSession).mockResolvedValue({
      userId: 4,
      role: "user",
      expiresAt: 4_000_000_000,
      token: "test-token",
    });
    vi.mocked(serverApiRequest).mockResolvedValue(payment);
  });

  it("posts the method and trimmed amount once and revalidates the job pages", async () => {
    expect(await recordJobPayment(12, "PromptPay", " 2500.50 ")).toEqual({
      status: "recorded",
      payment,
    });
    expect(serverApiRequest).toHaveBeenCalledExactlyOnceWith("/api/v1/jobs/12/payments", {
      method: "POST",
      body: JSON.stringify({ method: "PromptPay", amount: "2500.50" }),
    });
    expect(revalidatePath).toHaveBeenCalledWith("/creator/jobs/12");
    expect(revalidatePath).toHaveBeenCalledWith("/creator/jobs/12/payment");
  });

  it.each([
    [0, "PromptPay", "1"],
    ["12", "PromptPay", "1"],
    [12, "Cash", "1"],
    [12, "PromptPay", "1.234"],
    [12, "PromptPay", 1500],
  ])("rejects invalid input (%j, %j, %j) without calling the backend", async (job, m, a) => {
    expect((await recordJobPayment(job, m, a)).status).toBe("error");
    expect(serverApiRequest).not.toHaveBeenCalled();
  });

  it("requires a session", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    expect(await recordJobPayment(12, "PromptPay", "2500.50")).toEqual({
      status: "error",
      message: "Your session expired. Sign in again to continue.",
    });
    expect(serverApiRequest).not.toHaveBeenCalled();
  });

  it.each([
    [422, "payment_amount_mismatch", "mismatch"],
    [409, "payment_already_exists", "already_recorded"],
    [409, "job_not_payable", "unavailable"],
    [409, "accepted_offer_required", "unavailable"],
    [422, "validation_error", "error"],
    [401, "unauthorized", "error"],
    [403, "creator_required", "error"],
    [403, "forbidden", "error"],
    [404, "job_not_found", "error"],
    [500, "internal_error", "error"],
  ])("maps %i %s to %s", async (status, code, expected) => {
    vi.mocked(serverApiRequest).mockRejectedValue(new ApiError(status, code, "backend"));
    const result = await recordJobPayment(12, "PromptPay", "2500.50");
    expect(result.status).toBe(expected);
    expect(serverApiRequest).toHaveBeenCalledTimes(1);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("treats a lost response as a retryable error", async () => {
    vi.mocked(serverApiRequest).mockRejectedValue(new TypeError("fetch failed"));
    const result = await recordJobPayment(12, "PromptPay", "2500.50");
    expect(result).toMatchObject({ status: "error", message: expect.stringMatching(/twice/) });
  });

  it("does not report success for a response that is not this job's Paid payment", async () => {
    vi.mocked(serverApiRequest).mockResolvedValue({ ...payment, job_id: 99 });
    expect((await recordJobPayment(12, "PromptPay", "2500.50")).status).toBe("error");
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
