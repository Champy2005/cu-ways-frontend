import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { serverApiRequest } from "@/lib/api/server-client";
import { getHiredJob } from "./api";
import { startHiredJob } from "./actions";
import type { HiredJob } from "./types";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/api/server-client", () => ({ serverApiRequest: vi.fn() }));
vi.mock("./api", () => ({
  getHiredJob: vi.fn(),
  getHiredJobs: vi.fn(),
  jobFailure: () => "unavailable",
}));

const job: HiredJob = {
  id: 41,
  status: "Accepted",
  surveys: [],
  creator: "Mali",
  price: "8500.00",
  deliveryDate: null,
  deadline: null,
  targetResponses: null,
  briefUrl: null,
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getSession).mockResolvedValue({
    userId: 7,
    role: "user",
    token: "test-session",
    expiresAt: 9_999_999_999,
  });
  vi.mocked(getHiredJob).mockResolvedValue(job);
});

describe("starting a hired job", () => {
  it("requires a session and authoritative job access before dispatch", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    await expect(startHiredJob("41")).resolves.toEqual({ status: "expired" });
    expect(serverApiRequest).not.toHaveBeenCalled();
  });

  it("does not post when the authoritative job is already in progress", async () => {
    vi.mocked(getHiredJob).mockResolvedValue({ ...job, status: "In Progress" });
    await expect(startHiredJob("41")).resolves.toMatchObject({ status: "already-started" });
    expect(serverApiRequest).not.toHaveBeenCalled();
  });

  it("invalidates both routes only after the backend confirms the start", async () => {
    vi.mocked(serverApiRequest).mockResolvedValue({ job_id: 41, job_status: "In Progress" });
    await expect(startHiredJob("41")).resolves.toMatchObject({
      status: "started",
      job: { status: "In Progress" },
    });
    expect(serverApiRequest).toHaveBeenCalledWith("/api/v1/jobs/41/start", { method: "POST" });
    expect(revalidatePath).toHaveBeenCalledWith("/marketer/jobs", "layout");
  });

  it("preserves an unknown outcome after a transport failure without replaying the write", async () => {
    vi.mocked(serverApiRequest).mockRejectedValue(new Error("Connection lost"));
    await expect(startHiredJob("41")).resolves.toEqual({ status: "recheck" });
    expect(serverApiRequest).toHaveBeenCalledTimes(1);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
