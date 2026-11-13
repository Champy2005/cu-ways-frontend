import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PAYMENT_CHECK_TIMEOUT_MS,
  PAYMENT_SAVE_TIMEOUT_MS,
  requestPaymentRecord,
  requestPaymentStatus,
} from "./payment-client";

const paid = {
  payment_id: 9,
  job_id: 12,
  method: "PromptPay",
  amount: "2500.50",
  payment_status: "Paid",
  created_at: "2026-11-07T03:00:00Z",
  paid_at: "2026-11-07T03:00:00Z",
};

const fetchMock = vi.fn<typeof fetch>();

function ok(data: unknown) {
  return Response.json({ status: "success", data });
}

/** A request that never answers on its own, only when its signal aborts. */
function hanging(_input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return new Promise((_, reject) => {
    init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** Node's AbortSignal.timeout ignores fake timers; build it on setTimeout. */
function useFakeAbortTimeouts() {
  vi.useFakeTimers();
  vi.spyOn(AbortSignal, "timeout").mockImplementation((ms) => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(new DOMException("Timed out", "TimeoutError")), ms);
    return controller.signal;
  });
}

describe("requestPaymentRecord", () => {
  it("posts the method and amount to the payment route with a timeout", async () => {
    fetchMock.mockResolvedValue(ok({ status: "recorded", payment: paid }));
    expect(await requestPaymentRecord(12, "PromptPay", "2500.50")).toEqual({
      status: "recorded",
      payment: paid,
    });
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/jobs/12/payment");
    expect(init).toMatchObject({
      method: "POST",
      body: JSON.stringify({ method: "PromptPay", amount: "2500.50" }),
      signal: expect.any(AbortSignal),
    });
  });

  it.each([
    ["a lost response", () => Promise.reject(new TypeError("Simulated lost payment response"))],
    ["a server error", () => Promise.resolve(new Response(null, { status: 500 }))],
    [
      "a refused origin",
      () => Promise.resolve(Response.json({ status: "error" }, { status: 403 })),
    ],
    [
      "another job's payment",
      () => Promise.resolve(ok({ status: "recorded", payment: { ...paid, job_id: 99 } })),
    ],
    [
      "a Pending payment reported as recorded",
      () =>
        Promise.resolve(
          ok({ status: "recorded", payment: { ...paid, payment_status: "Pending" } }),
        ),
    ],
    ["an unknown result", () => Promise.resolve(ok({ status: "cancelled" }))],
  ])("reports an unknown outcome, never failure, after %s", async (_name, respond) => {
    fetchMock.mockImplementation(respond);
    expect(await requestPaymentRecord(12, "PromptPay", "2500.50")).toMatchObject({
      status: "unknown",
      message: expect.stringMatching(/Check the payment status/),
    });
  });

  it("stops waiting when the save never answers", async () => {
    useFakeAbortTimeouts();
    fetchMock.mockImplementation(hanging);
    const result = requestPaymentRecord(12, "PromptPay", "2500.50");
    await vi.advanceTimersByTimeAsync(PAYMENT_SAVE_TIMEOUT_MS);
    await expect(result).resolves.toMatchObject({ status: "unknown" });
  });
});

describe("requestPaymentStatus", () => {
  it.each([
    [{ status: "found", payment: paid }],
    [{ status: "none" }],
    [{ status: "error", message: "Your session expired." }],
  ])("returns the route's check result %j", async (data) => {
    fetchMock.mockResolvedValue(ok(data));
    expect(await requestPaymentStatus(12)).toEqual(data);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/jobs/12/payment");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ signal: expect.any(AbortSignal) });
  });

  it.each([
    ["a lost response", () => Promise.reject(new TypeError("Failed to fetch"))],
    [
      "another job's payment",
      () => Promise.resolve(ok({ status: "found", payment: { ...paid, job_id: 99 } })),
    ],
  ])("reports a failed check after %s", async (_name, respond) => {
    fetchMock.mockImplementation(respond);
    expect(await requestPaymentStatus(12)).toEqual({
      status: "error",
      message: expect.stringMatching(/could not be checked/),
    });
  });

  it("stops waiting when the check never answers", async () => {
    useFakeAbortTimeouts();
    fetchMock.mockImplementation(hanging);
    const result = requestPaymentStatus(12);
    await vi.advanceTimersByTimeAsync(PAYMENT_CHECK_TIMEOUT_MS);
    await expect(result).resolves.toMatchObject({ status: "error" });
  });

  it("is not held up by a save that is still waiting", async () => {
    // The reported bug: the check waited behind the stuck save.
    fetchMock.mockImplementation((input, init) =>
      init?.method === "POST" ? hanging(input, init) : Promise.resolve(ok({ status: "none" })),
    );
    let saveSettled = false;
    void requestPaymentRecord(12, "PromptPay", "2500.50").then(() => {
      saveSettled = true;
    });
    await expect(requestPaymentStatus(12)).resolves.toEqual({ status: "none" });
    expect(saveSettled).toBe(false);
  });
});
