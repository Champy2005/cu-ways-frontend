import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { getCurrentJobPayment } from "@/features/jobs/api";
import { getSession } from "@/lib/auth/session";
import { ApiError } from "@/lib/api/errors";
import { serverApiRequest } from "@/lib/api/server-client";
import { checkJobPayment, recordJobPayment } from "./payment-actions";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/api/server-client", () => ({ serverApiRequest: vi.fn() }));
vi.mock("@/features/jobs/api", () => ({ getCurrentJobPayment: vi.fn() }));

const payment = {
  payment_id: 9,
  job_id: 12,
  method: "PromptPay" as const,
  amount: "2500.50",
  payment_status: "Paid" as const,
  created_at: "2026-11-07T03:00:00Z",
  paid_at: "2026-11-07T03:00:00Z",
};

const pendingPayment = {
  ...payment,
  payment_id: 4,
  payment_status: "Pending" as const,
  paid_at: null,
};

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

describe("recordJobPayment", () => {
  it("posts the method and trimmed amount once with a timeout and revalidates the job pages", async () => {
    expect(await recordJobPayment(12, "PromptPay", " 2500.50 ")).toEqual({
      status: "recorded",
      payment,
    });
    expect(serverApiRequest).toHaveBeenCalledExactlyOnceWith("/api/v1/jobs/12/payments", {
      method: "POST",
      body: JSON.stringify({ method: "PromptPay", amount: "2500.50" }),
      signal: expect.any(AbortSignal),
    });
    expect(getCurrentJobPayment).not.toHaveBeenCalled();
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
    [409, "job_not_payable", "unavailable"],
    [409, "accepted_offer_required", "unavailable"],
    [422, "validation_error", "error"],
    [401, "unauthorized", "error"],
    [403, "creator_required", "error"],
    [403, "forbidden", "error"],
    [404, "job_not_found", "error"],
    [500, "internal_error", "error"],
  ])("maps %i %s to %s without re-reading the payment", async (status, code, expected) => {
    vi.mocked(serverApiRequest).mockRejectedValue(new ApiError(status, code, "backend"));
    const result = await recordJobPayment(12, "PromptPay", "2500.50");
    expect(result.status).toBe(expected);
    expect(serverApiRequest).toHaveBeenCalledTimes(1);
    expect(getCurrentJobPayment).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  describe("when a payment already exists (409)", () => {
    beforeEach(() => {
      vi.mocked(serverApiRequest).mockRejectedValue(
        new ApiError(409, "payment_already_exists", "backend"),
      );
    });

    it("returns the real Pending payment instead of assuming Paid", async () => {
      vi.mocked(getCurrentJobPayment).mockResolvedValue(pendingPayment);
      const result = await recordJobPayment(12, "PromptPay", "2500.50");
      expect(result).toEqual({
        status: "existing",
        payment: pendingPayment,
        message: expect.stringMatching(/no new payment was created/),
      });
      expect(getCurrentJobPayment).toHaveBeenCalledExactlyOnceWith(12);
      expect(serverApiRequest).toHaveBeenCalledTimes(1);
    });

    it.each([
      ["the read fails", () => Promise.reject(new TypeError("fetch failed"))],
      ["the read returns nothing", () => Promise.resolve(null)],
    ])("reports an unconfirmed payment when %s", async (_name, read) => {
      vi.mocked(getCurrentJobPayment).mockImplementation(read);
      const result = await recordJobPayment(12, "PromptPay", "2500.50");
      expect(result.status).toBe("existing_unconfirmed");
      expect(JSON.stringify(result)).not.toMatch(/Paid/);
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("when the request fails in transit or times out", () => {
    it.each([
      ["a lost connection", new TypeError("fetch failed")],
      ["a timeout", new DOMException("The operation timed out.", "TimeoutError")],
    ])("shows the saved payment after %s", async (_name, error) => {
      vi.mocked(serverApiRequest).mockRejectedValue(error);
      vi.mocked(getCurrentJobPayment).mockResolvedValue(payment);
      expect(await recordJobPayment(12, "PromptPay", "2500.50")).toMatchObject({
        status: "existing",
        payment,
      });
      expect(serverApiRequest).toHaveBeenCalledTimes(1);
    });

    it("does not claim failure when no payment is found yet, since it may still be saving", async () => {
      vi.mocked(serverApiRequest).mockRejectedValue(
        new DOMException("The operation timed out.", "TimeoutError"),
      );
      vi.mocked(getCurrentJobPayment).mockResolvedValue(null);
      const result = await recordJobPayment(12, "PromptPay", "2500.50");
      expect(result).toMatchObject({
        status: "unknown",
        message: expect.stringMatching(/Check the payment status/),
      });
      expect(JSON.stringify(result)).not.toMatch(/not recorded/);
    });

    it("reports an unknown outcome when the payment cannot be checked either", async () => {
      vi.mocked(serverApiRequest).mockRejectedValue(new TypeError("fetch failed"));
      vi.mocked(getCurrentJobPayment).mockRejectedValue(new TypeError("fetch failed"));
      expect(await recordJobPayment(12, "PromptPay", "2500.50")).toMatchObject({
        status: "unknown",
        message: expect.stringMatching(/Check the payment status/),
      });
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });

  it("checks the backend instead of reporting success for another job's payment", async () => {
    vi.mocked(serverApiRequest).mockResolvedValue({ ...payment, job_id: 99 });
    vi.mocked(getCurrentJobPayment).mockResolvedValue(null);
    expect((await recordJobPayment(12, "PromptPay", "2500.50")).status).toBe("unknown");
    expect(getCurrentJobPayment).toHaveBeenCalledWith(12);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("checkJobPayment", () => {
  it("returns the job's active payment", async () => {
    vi.mocked(getCurrentJobPayment).mockResolvedValue(pendingPayment);
    expect(await checkJobPayment(12)).toEqual({ status: "found", payment: pendingPayment });
    expect(revalidatePath).toHaveBeenCalledWith("/creator/jobs/12/payment");
  });

  it("reports when no payment exists", async () => {
    vi.mocked(getCurrentJobPayment).mockResolvedValue(null);
    expect(await checkJobPayment(12)).toEqual({ status: "none" });
  });

  it.each([
    [new ApiError(401, "unauthorized", "backend"), /session expired/],
    [new ApiError(403, "forbidden", "backend"), /no longer have access/],
    [new TypeError("fetch failed"), /could not be checked/],
  ])("maps a failed read to a message", async (error, message) => {
    vi.mocked(getCurrentJobPayment).mockRejectedValue(error);
    expect(await checkJobPayment(12)).toEqual({
      status: "error",
      message: expect.stringMatching(message),
    });
  });

  it("validates the job and session before reading", async () => {
    expect((await checkJobPayment("12")).status).toBe("error");
    vi.mocked(getSession).mockResolvedValue(null);
    expect((await checkJobPayment(12)).status).toBe("error");
    expect(getCurrentJobPayment).not.toHaveBeenCalled();
  });
});
