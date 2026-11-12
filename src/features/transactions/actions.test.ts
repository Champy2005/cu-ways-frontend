import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { saveJobMutation } from "./actions";

const { request, payment, session } = vi.hoisted(() => ({
  request: vi.fn(),
  payment: vi.fn(),
  session: vi.fn(),
}));
vi.mock("@/lib/api/server-client", () => ({ serverApiRequest: request }));
vi.mock("@/lib/auth/session", () => ({ getSession: session }));
vi.mock("./queries", () => ({
  jobPath: (id: string) => `/api/v1/jobs/${id}`,
  getPayment: payment,
}));

describe("job action recovery", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    session.mockResolvedValue({ userId: 1 });
  });

  it("checks authoritative state after a duplicate payment response", async () => {
    request.mockRejectedValue(new ApiError(409, "payment_already_exists", "Already recorded"));
    payment.mockResolvedValue({ payment: { payment_id: 3 } });
    await expect(
      saveJobMutation("42", { kind: "payment", input: { method: "PromptPay", amount: "100" } }),
    ).resolves.toEqual({ status: "saved" });
    expect(payment).toHaveBeenCalledWith("42");
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("blocks another submit when the result is unknown and the read also fails", async () => {
    request.mockRejectedValue(new TypeError("Connection closed"));
    payment.mockRejectedValue(new TypeError("Connection closed"));
    await expect(saveJobMutation("42", { kind: "complete" })).resolves.toMatchObject({
      status: "reconcile",
    });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("surfaces a failed prerequisite after checking that completion was not saved", async () => {
    request.mockRejectedValue(
      new ApiError(409, "completion_proof_required", "Delivery proof is required"),
    );
    payment.mockResolvedValue({ job_status: "In Progress" });
    await expect(saveJobMutation("42", { kind: "complete" })).resolves.toEqual({
      status: "error",
      message: "Delivery proof is required",
    });
  });
});
