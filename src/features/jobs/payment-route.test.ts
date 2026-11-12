import { beforeEach, describe, expect, it, vi } from "vitest";
import { isAllowedFrontendOrigin } from "@/lib/auth/origin";
import { checkJobPayment, recordJobPayment } from "./payment-actions";
import { checkPaymentRoute, recordPaymentRoute } from "./payment-route";

vi.mock("@/lib/auth/origin", () => ({ isAllowedFrontendOrigin: vi.fn() }));
vi.mock("./payment-actions", () => ({ recordJobPayment: vi.fn(), checkJobPayment: vi.fn() }));

function post(body: string) {
  return new Request("http://localhost:3000/api/jobs/12/payment", {
    method: "POST",
    headers: { Origin: "http://localhost:3000", "Content-Type": "application/json" },
    body,
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(isAllowedFrontendOrigin).mockReturnValue(true);
});

describe("payment API route", () => {
  it("records the payment and returns the save result without caching", async () => {
    const result = { status: "error" as const, message: "Check the amount." };
    vi.mocked(recordJobPayment).mockResolvedValue(result);
    const response = await recordPaymentRoute(
      post(JSON.stringify({ method: "PromptPay", amount: "1500" })),
      "12",
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ status: "success", data: result });
    expect(recordJobPayment).toHaveBeenCalledExactlyOnceWith(12, "PromptPay", "1500");
  });

  it("refuses a save from another origin without touching the backend", async () => {
    vi.mocked(isAllowedFrontendOrigin).mockReturnValue(false);
    const response = await recordPaymentRoute(post("{}"), "12");
    expect(response.status).toBe(403);
    expect(recordJobPayment).not.toHaveBeenCalled();
  });

  it.each(["0", "abc", "12.5", "-3", "99999999999"])("rejects job id %s", async (id) => {
    expect((await recordPaymentRoute(post("{}"), id)).status).toBe(422);
    expect((await checkPaymentRoute(id)).status).toBe(422);
    expect(recordJobPayment).not.toHaveBeenCalled();
    expect(checkJobPayment).not.toHaveBeenCalled();
  });

  it("rejects a body that is not JSON", async () => {
    expect((await recordPaymentRoute(post("not json"), "12")).status).toBe(422);
    expect(recordJobPayment).not.toHaveBeenCalled();
  });

  it("passes a non-object body on so the save validates it", async () => {
    vi.mocked(recordJobPayment).mockResolvedValue({ status: "error", message: "Invalid." });
    await recordPaymentRoute(post("null"), "12");
    expect(recordJobPayment).toHaveBeenCalledWith(12, undefined, undefined);
  });

  it("returns the status check result without caching", async () => {
    vi.mocked(checkJobPayment).mockResolvedValue({ status: "none" });
    const response = await checkPaymentRoute("12");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ status: "success", data: { status: "none" } });
    expect(checkJobPayment).toHaveBeenCalledExactlyOnceWith(12);
  });
});
