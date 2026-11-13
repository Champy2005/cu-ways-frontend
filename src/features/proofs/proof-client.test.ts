import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requestProofCheck, requestProofSave } from "./proof-client";
import { PROOF_SAVE_DEADLINE_MS } from "./proof-limits";

const fetchMock = vi.fn();
const ok = (data: unknown) =>
  new Response(JSON.stringify({ status: "success", data }), { status: 200 });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("requestProofSave", () => {
  it("posts to the proof route with an abort signal", async () => {
    fetchMock.mockResolvedValue(ok({ status: "saved" }));
    await expect(requestProofSave(7, "https://x.test/a")).resolves.toEqual({ status: "saved" });
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/jobs/7/proofs");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ url: "https://x.test/a" }));
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("aborts after the 12 s deadline and reports the outcome as unknown (A03)", async () => {
    // AbortSignal.timeout uses a native timer, so the deadline is fired by hand here.
    const deadline = new AbortController();
    const timeout = vi.spyOn(AbortSignal, "timeout").mockReturnValue(deadline.signal);
    fetchMock.mockImplementation(
      (_path: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => reject(init.signal?.reason));
        }),
    );
    const result = requestProofSave(7, "https://x.test/a");
    expect(timeout).toHaveBeenCalledWith(PROOF_SAVE_DEADLINE_MS);
    deadline.abort(new DOMException("The operation timed out.", "TimeoutError"));
    await expect(result).resolves.toEqual({ status: "unknown" });
    timeout.mockRestore();
  });

  it.each([
    ["a network failure", () => Promise.reject(new TypeError("fetch failed"))],
    ["an unreadable body", () => Promise.resolve(new Response("oops", { status: 200 }))],
    ["an unexpected shape", () => Promise.resolve(ok({ status: "weird" }))],
    ["a route error", () => Promise.resolve(new Response("{}", { status: 500 }))],
  ])("treats %s as unknown", async (_name, response) => {
    fetchMock.mockImplementation(response);
    await expect(requestProofSave(7, "https://x.test/a")).resolves.toEqual({ status: "unknown" });
  });

  it("passes a backend refusal through with its code", async () => {
    const refusal = { status: "error", code: "job_not_in_progress", message: "no" };
    fetchMock.mockResolvedValue(ok(refusal));
    await expect(requestProofSave(7, "https://x.test/a")).resolves.toEqual(refusal);
  });
});

describe("requestProofCheck", () => {
  it("reads the list independently of a save that is still pending", async () => {
    fetchMock.mockImplementation((_path: string, init: RequestInit) =>
      init.method === "POST"
        ? new Promise(() => {})
        : Promise.resolve(ok({ status: "ok", proofs: [] })),
    );
    void requestProofSave(7, "https://x.test/a");
    await expect(requestProofCheck(7)).resolves.toEqual({ status: "ok", proofs: [] });
  });

  it("reports a failed or malformed check as check_failed", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    await expect(requestProofCheck(7)).resolves.toMatchObject({ code: "check_failed" });
    fetchMock.mockResolvedValueOnce(ok({ status: "ok", proofs: [{ url: 1 }] }));
    await expect(requestProofCheck(7)).resolves.toMatchObject({ code: "check_failed" });
  });
});
