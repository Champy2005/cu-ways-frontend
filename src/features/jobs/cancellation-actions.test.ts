import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { serverApiGet, serverApiRequest } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { getCreatorJob, getCurrentJobPayment, getJobOffers, getJobSentInvitations } from "./api";
import { cancelCreatorJob, loadCancellationDetails } from "./cancellation-actions";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/api/server-client", () => ({ serverApiGet: vi.fn(), serverApiRequest: vi.fn() }));
vi.mock("./api", () => ({
  getCreatorJob: vi.fn(),
  getCurrentJobPayment: vi.fn(),
  getJobOffers: vi.fn(),
  getJobSentInvitations: vi.fn(),
}));

const saved = {
  job_id: 41,
  job_status: "Cancelled",
  cancelled_at: "2026-11-12T09:00:00Z",
  cancel_reason: null,
  closed_job_request_ids: [2],
  rejected_offer_ids: [3],
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getSession).mockResolvedValue({
    userId: 4,
    role: "user",
    expiresAt: 4_000_000_000,
    token: "test",
  });
  vi.mocked(getCreatorJob).mockResolvedValue({
    job_id: 41,
    job_status: "Pending",
    title: "Campus dining",
    created_at: "2026-11-01T00:00:00Z",
    surveys: [],
  });
  vi.mocked(getCurrentJobPayment).mockResolvedValue(null);
  vi.mocked(serverApiGet).mockResolvedValue([]);
  vi.mocked(getJobOffers).mockResolvedValue([]);
  vi.mocked(getJobSentInvitations).mockResolvedValue([]);
  vi.mocked(serverApiRequest).mockResolvedValue(saved);
});

describe("Creator cancellation boundary", () => {
  it("requires the current session before reading or writing", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    expect(await cancelCreatorJob("41", 4)).toMatchObject({ status: "unavailable" });
    expect(getCreatorJob).not.toHaveBeenCalled();
    expect(serverApiRequest).not.toHaveBeenCalled();
  });

  it("rejects a different signed-in user and malformed job IDs", async () => {
    expect(await cancelCreatorJob("41", 7)).toMatchObject({ status: "unavailable" });
    expect(await cancelCreatorJob("../41", 4)).toMatchObject({ status: "unavailable" });
    expect(getCreatorJob).not.toHaveBeenCalled();
    expect(serverApiRequest).not.toHaveBeenCalled();
  });

  it("authorizes ownership before loading contract history", async () => {
    vi.mocked(getCreatorJob).mockRejectedValue(new ApiError(403, "forbidden", "Denied"));
    expect(await loadCancellationDetails("41", 4)).toMatchObject({ status: "unavailable" });
    expect(getCurrentJobPayment).not.toHaveBeenCalled();
    expect(getJobOffers).not.toHaveBeenCalled();
    expect(getJobSentInvitations).not.toHaveBeenCalled();
    expect(serverApiGet).not.toHaveBeenCalled();
  });

  it("counts active requests consistently and retains the bounded read", async () => {
    vi.mocked(getJobSentInvitations).mockResolvedValue(
      (["Pending", "Accepted", "Closed", "Declined"] as const).map((request_status, index) => ({
        job_request_id: index + 1,
        job_id: 41,
        marketer_id: index + 7,
        marketer_name: "Test marketer",
        request_status,
        created_at: "2026-11-01T00:00:00Z",
        responded_at: null,
      })),
    );
    await expect(loadCancellationDetails("41", 4)).resolves.toMatchObject({
      status: "ready",
      details: { activeRequests: 2 },
    });
    expect(getJobSentInvitations).toHaveBeenCalledWith(41, {
      signal: expect.any(AbortSignal),
    });
  });

  it.each(["Accepted", "In Progress", "Completed"] as const)(
    "does not POST when the fresh saved status is %s",
    async (job_status) => {
      vi.mocked(getCreatorJob).mockResolvedValue({
        job_id: 41,
        job_status,
        created_at: "2026-11-01T00:00:00Z",
        surveys: [],
      });
      expect(await cancelCreatorJob("41", 4)).toMatchObject({ status: "rejected" });
      expect(serverApiRequest).not.toHaveBeenCalled();
    },
  );

  it("blocks any Paid payment regardless of amount", async () => {
    vi.mocked(getCurrentJobPayment).mockResolvedValue({
      payment_id: 1,
      job_id: 41,
      method: "PromptPay",
      amount: "1.00",
      payment_status: "Paid",
      paid_at: null,
      created_at: null,
    });
    expect(await cancelCreatorJob("41", 4)).toMatchObject({
      status: "rejected",
      message: expect.stringContaining("Paid"),
    });
    expect(serverApiRequest).not.toHaveBeenCalled();
  });

  it("does not guess eligibility after a failed payment read", async () => {
    vi.mocked(getCurrentJobPayment).mockRejectedValue(new Error("offline"));
    expect(await cancelCreatorJob("41", 4)).toMatchObject({ status: "rejected" });
    expect(serverApiRequest).not.toHaveBeenCalled();
  });

  it("submits to the existing cancellation endpoint and reports the confirmed transaction", async () => {
    expect(await cancelCreatorJob("41", 4)).toMatchObject({
      status: "cancelled",
      details: {
        status: "Cancelled",
        activeRequests: 0,
        pendingOffers: 0,
        cancelledAt: saved.cancelled_at,
      },
    });
    expect(serverApiRequest).toHaveBeenCalledExactlyOnceWith(
      "/api/v1/jobs/41/cancel",
      expect.objectContaining({ method: "POST", body: "{}" }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/creator/jobs", "layout");
  });

  it("never resubmits an already Cancelled job", async () => {
    vi.mocked(getCreatorJob).mockResolvedValue({
      job_id: 41,
      job_status: "Cancelled",
      created_at: "2026-11-01T00:00:00Z",
      surveys: [],
    });
    expect(await cancelCreatorJob("41", 4)).toMatchObject({ status: "cancelled" });
    expect(serverApiRequest).not.toHaveBeenCalled();
  });

  it("keeps transport failures and mismatched success responses uncertain without retrying", async () => {
    vi.mocked(serverApiRequest).mockRejectedValueOnce(new Error("connection lost"));
    expect(await cancelCreatorJob("41", 4)).toMatchObject({ status: "unknown" });
    expect(serverApiRequest).toHaveBeenCalledTimes(1);
    vi.mocked(serverApiRequest).mockResolvedValueOnce({ ...saved, job_id: 42 });
    expect(await cancelCreatorJob("41", 4)).toMatchObject({ status: "unknown" });
    expect(serverApiRequest).toHaveBeenCalledTimes(2);
  });

  it("retains confirmed success if cache invalidation fails", async () => {
    vi.mocked(revalidatePath).mockImplementation(() => {
      throw new Error("cache failed");
    });
    expect(await cancelCreatorJob("41", 4)).toMatchObject({ status: "cancelled" });
  });

  it("distinguishes a definite rejection from an unknown write outcome", async () => {
    vi.mocked(serverApiRequest).mockRejectedValue(
      new ApiError(409, "job_has_paid_payment", "Paid"),
    );
    expect(await cancelCreatorJob("41", 4)).toMatchObject({ status: "rejected" });
  });
});
