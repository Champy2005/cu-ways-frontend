import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMarketerOffers } from "@/features/job-invitations/live/api";
import type { MarketerOfferItem } from "@/features/job-invitations/live/types";
import { serverApiGet } from "@/lib/api/server-client";
import { getHiredJob, getHiredJobs } from "./api";

vi.mock("@/features/job-invitations/live/api", () => ({ getMarketerOffers: vi.fn() }));
vi.mock("@/lib/api/server-client", () => ({ serverApiGet: vi.fn() }));

function item(id: number, status: "Accepted" | "Pending" = "Accepted"): MarketerOfferItem {
  return {
    request: {
      job_request_id: id,
      job_id: id,
      marketer_id: 7,
      request_status: "Accepted",
      created_at: "2026-11-01T00:00:00Z",
      responded_at: null,
      job: {
        job_id: id,
        job_status: "Accepted",
        creator: { user_id: 4, name: "Mali" },
        deadline: null,
        target_responses: null,
        surveys: [],
        brief: null,
      },
    },
    offer: {
      offer_id: id,
      job_id: id,
      job_request_id: id,
      marketer_id: 7,
      offer_status: status,
      offered_price: "8500.00",
      delivery_date: null,
      message: null,
      created_at: "2026-11-01T00:00:00Z",
    },
  };
}

beforeEach(() => vi.resetAllMocks());

describe("hired marketer job reads", () => {
  it("only lists this marketer's hired jobs, newest job ID first", async () => {
    const other = item(99);
    other.offer.marketer_id = 8;
    vi.mocked(getMarketerOffers).mockResolvedValue({
      offers: [item(4), item(9), item(12, "Pending"), other],
      offersUnavailable: false,
    });
    expect((await getHiredJobs(7)).map((job) => job.id)).toEqual([9, 4]);
  });

  it("does not turn an incomplete offer history into a false empty state", async () => {
    vi.mocked(getMarketerOffers).mockResolvedValue({ offers: [], offersUnavailable: true });
    await expect(getHiredJobs(7)).rejects.toThrow("incomplete");
  });

  it("checks authoritative detail ownership before loading private context", async () => {
    vi.mocked(serverApiGet).mockResolvedValue({ job_id: 41, marketer: { user_id: 8 } });
    await expect(getHiredJob("41", 7)).rejects.toMatchObject({ status: 404 });
    expect(getMarketerOffers).not.toHaveBeenCalled();
  });

  it("uses the saved lifecycle and agreed price instead of a stale invitation", async () => {
    vi.mocked(serverApiGet).mockResolvedValue({
      job_id: 41,
      marketer: { user_id: 7 },
      job_status: "Completed",
      accepted_price: "9000.00",
    });
    vi.mocked(getMarketerOffers).mockResolvedValue({
      offers: [item(41)],
      offersUnavailable: false,
    });
    await expect(getHiredJob("41", 7)).resolves.toMatchObject({
      id: 41,
      status: "Completed",
      price: "9000.00",
    });
    expect(getMarketerOffers).toHaveBeenCalledExactlyOnceWith(41);
  });

  it.each(["../41", "0", "2147483648"])("rejects invalid ID %s before any API read", async (id) => {
    await expect(getHiredJob(id, 7)).rejects.toMatchObject({ status: 422 });
    expect(serverApiGet).not.toHaveBeenCalled();
    expect(getMarketerOffers).not.toHaveBeenCalled();
  });

  it("loads proofs while the selected job's history is still pending", async () => {
    let resolveHistory!: (value: Awaited<ReturnType<typeof getMarketerOffers>>) => void;
    vi.mocked(getMarketerOffers).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveHistory = resolve;
        }),
    );
    vi.mocked(serverApiGet)
      .mockResolvedValueOnce({
        job_id: 41,
        marketer: { user_id: 7, name: "Mali" },
        job_status: "In Progress",
        accepted_price: "9000.00",
      })
      .mockResolvedValueOnce([]);
    const read = getHiredJob("41", 7);
    await vi.waitFor(() =>
      expect(serverApiGet).toHaveBeenCalledWith(
        "/api/v1/jobs/41/proofs",
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      ),
    );
    resolveHistory({ offers: [item(41)], offersUnavailable: false });
    await expect(read).resolves.toMatchObject({ completion: { status: "ready", proofs: [] } });
  });
});
