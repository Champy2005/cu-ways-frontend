import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { ApiError } from "@/lib/api/errors";
import { serverApiRequest } from "@/lib/api/server-client";
import { loadJobOffersInitialData } from "./api";
import { acceptJobOffer, refreshJobOffers } from "./offer-actions";
import { acceptedSnapshot, testJob, testOffer } from "./testing/offer-fixtures";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/api/server-client", () => ({ serverApiRequest: vi.fn() }));
vi.mock("./api", () => ({ loadJobOffersInitialData: vi.fn() }));

function mockSnapshot(data = acceptedSnapshot()) {
  vi.mocked(loadJobOffersInitialData).mockResolvedValue({
    job: data.job,
    offers: { status: "success", items: data.offers },
  });
}

describe("creator offer acceptance", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getSession).mockResolvedValue({
      userId: 4,
      role: "user",
      expiresAt: 4_000_000_000,
      token: "test-token",
    });
    vi.mocked(serverApiRequest).mockResolvedValue({});
    mockSnapshot();
  });

  it.each([
    [0, 101],
    [12, -1],
    ["12", 101],
    [12, 2_147_483_648],
  ])("rejects invalid identifiers (%s, %s)", async (job, offer) => {
    expect((await acceptJobOffer(job, offer)).status).toBe("error");
    expect(serverApiRequest).not.toHaveBeenCalled();
  });

  it("requires a session before mutating or refreshing", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    expect((await acceptJobOffer(12, 101)).status).toBe("error");
    expect((await refreshJobOffers(12)).status).toBe("error");
    expect(serverApiRequest).not.toHaveBeenCalled();
    expect(loadJobOffersInitialData).not.toHaveBeenCalled();
  });

  it("posts once and returns authoritative job and competing offer statuses", async () => {
    expect(await acceptJobOffer(12, 101)).toEqual({ status: "accepted", data: acceptedSnapshot() });
    expect(serverApiRequest).toHaveBeenCalledExactlyOnceWith("/api/v1/jobs/12/offers/101/accept", {
      method: "POST",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/creator/jobs/12/offers");
    expect(revalidatePath).toHaveBeenCalledWith("/creator/jobs/12/invite");
  });

  it.each(["offer_not_pending", "offer_not_found", "job_not_pending"])(
    "reconciles a stale %s response without retrying",
    async (code) => {
      vi.mocked(serverApiRequest).mockRejectedValue(
        new ApiError(code === "offer_not_found" ? 404 : 409, code, "changed"),
      );
      mockSnapshot({ job: testJob, offers: [{ ...testOffer(), offer_status: "Withdrawn" }] });
      const result = await acceptJobOffer(12, 101);
      expect(result).toMatchObject({
        status: "conflict",
        data: { offers: [{ offer_status: "Withdrawn" }] },
      });
      expect(serverApiRequest).toHaveBeenCalledTimes(1);
      expect(revalidatePath).not.toHaveBeenCalled();
    },
  );

  it("shows a different winner selected in another tab without claiming success", async () => {
    vi.mocked(serverApiRequest).mockRejectedValue(
      new ApiError(409, "job_not_pending", "already hired"),
    );
    mockSnapshot({
      job: { ...testJob, job_status: "Accepted" },
      offers: [
        { ...testOffer(), offer_status: "Rejected" },
        { ...testOffer(102), offer_status: "Accepted" },
      ],
    });
    expect((await acceptJobOffer(12, 101)).status).toBe("conflict");
  });

  it.each([401, 403])("handles %s without reading protected data", async (status) => {
    vi.mocked(serverApiRequest).mockRejectedValue(
      new ApiError(status, "forbidden", "private details"),
    );
    const result = await acceptJobOffer(12, 101);
    expect(result.status).toBe("error");
    expect(loadJobOffersInitialData).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain("private details");
  });

  it("does not report success for a lost response or retry the mutation", async () => {
    vi.mocked(serverApiRequest).mockRejectedValue(new Error("connection lost"));
    expect((await acceptJobOffer(12, 101)).status).toBe("uncertain");
    expect(serverApiRequest).toHaveBeenCalledTimes(1);
  });

  it("requires a confirmed accepted offer after an apparently successful POST", async () => {
    mockSnapshot({ job: testJob, offers: [testOffer()] });
    expect((await acceptJobOffer(12, 101)).status).toBe("uncertain");
  });

  it("keeps the result uncertain when the follow-up read fails", async () => {
    vi.mocked(loadJobOffersInitialData).mockResolvedValue({
      job: { ...testJob, job_status: "Accepted" },
      offers: { status: "error", message: "offline" },
    });
    expect((await acceptJobOffer(12, 101)).status).toBe("uncertain");
    expect((await refreshJobOffers(12)).status).toBe("error");
  });

  it("can recover the authoritative state with a read-only refresh", async () => {
    expect(await refreshJobOffers(12)).toEqual({ status: "ready", data: acceptedSnapshot() });
    expect(serverApiRequest).not.toHaveBeenCalled();
  });
});
