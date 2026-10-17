import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";
import { serverApiGet } from "@/lib/api/server-client";
import { listMarketers } from "@/features/marketer-discovery/api";
import {
  getCreatorJobs,
  getJobSentInvitations,
  loadCreatorJobs,
  loadJobInviteInitialData,
} from "@/features/jobs/api";

vi.mock("@/lib/api/server-client", () => ({ serverApiGet: vi.fn() }));
vi.mock("@/features/marketer-discovery/api", () => ({ listMarketers: vi.fn() }));

const job = {
  job_id: 17,
  job_status: "Pending" as const,
  created_at: "2026-10-01T10:00:00Z",
  surveys: [{ survey_id: 41, title: "Campus mobility" }],
};

const invitation = {
  job_request_id: 23,
  job_id: 17,
  marketer_id: 7,
  request_status: "Pending" as const,
  created_at: "2026-10-02T10:00:00Z",
  responded_at: null,
  marketer_name: "Mali S.",
};

describe("Creator job invitation data", () => {
  beforeEach(() => {
    vi.mocked(serverApiGet).mockReset();
    vi.mocked(listMarketers).mockReset();
  });

  it("loads the authenticated Creator job summaries from the server API", async () => {
    vi.mocked(serverApiGet).mockResolvedValue([job]);

    await expect(getCreatorJobs()).resolves.toEqual([job]);
    expect(serverApiGet).toHaveBeenCalledWith("/api/v1/me/jobs");
  });

  it("validates sent invitation history before returning typed rows", async () => {
    vi.mocked(serverApiGet).mockResolvedValue([invitation]);

    await expect(getJobSentInvitations(17)).resolves.toEqual([invitation]);
    expect(serverApiGet).toHaveBeenCalledWith("/api/v1/jobs/17/requests");
  });

  it.each([
    ["a non-array response", {}],
    ["a null row", [null]],
    ["a row for another job", [{ ...invitation, job_id: 18 }]],
    ["an invalid status", [{ ...invitation, request_status: "Queued" }]],
    ["a missing marketer name", [{ ...invitation, marketer_name: undefined }]],
    [
      "duplicate request IDs",
      [invitation, { ...invitation, marketer_id: 8, marketer_name: "Anan K." }],
    ],
  ])("rejects malformed sent invitation history (%s)", async (_label, response) => {
    vi.mocked(serverApiGet).mockResolvedValue(response as never);

    await expect(getJobSentInvitations(17)).rejects.toThrow(
      "invitation history response was invalid",
    );
  });

  it("returns a truthful error state when owned jobs cannot be loaded", async () => {
    vi.mocked(serverApiGet).mockRejectedValue(new ApiError(503, "unavailable", "offline"));

    await expect(loadCreatorJobs()).resolves.toEqual({
      status: "error",
      message: "Your jobs could not be loaded. Refresh and try again.",
    });
  });

  it("checks job access before starting invitations and marketer reads", async () => {
    const calls: string[] = [];
    vi.mocked(serverApiGet).mockImplementation(async (path) => {
      calls.push(path);
      if (path === "/api/v1/jobs/17") return job;
      if (path === "/api/v1/jobs/17/requests") return [invitation];
      throw new Error(`Unexpected path ${path}`);
    });
    vi.mocked(listMarketers).mockImplementation(async () => {
      calls.push("marketers");
      return {
        items: [
          {
            marketer_id: 7,
            display_name: "Mali S.",
            headline: "Data Collection",
            is_verified: false,
            average_rating: 4.8,
            rating_count: 12,
          },
        ],
        total: 1,
      };
    });

    const result = await loadJobInviteInitialData(17);

    expect(calls[0]).toBe("/api/v1/jobs/17");
    expect(calls.slice(1)).toEqual(["/api/v1/jobs/17/requests", "marketers"]);
    expect(result).toMatchObject({
      job,
      invitations: { status: "success", items: [invitation] },
      marketers: {
        status: "success",
        items: [
          {
            marketer_id: 7,
            display_name: "Mali S.",
            headline: "Data Collection",
            average_rating: 4.8,
            rating_count: 12,
          },
        ],
        total: 1,
        pageSize: 100,
      },
    });
  });

  it("does not request invitations or marketers when the job is missing or foreign", async () => {
    vi.mocked(serverApiGet).mockRejectedValue(new ApiError(404, "not_found", "not found"));

    await expect(loadJobInviteInitialData(404)).rejects.toThrow("not found");

    expect(serverApiGet).toHaveBeenCalledTimes(1);
    expect(serverApiGet).toHaveBeenCalledWith("/api/v1/jobs/404");
    expect(listMarketers).not.toHaveBeenCalled();
  });

  it("keeps invitation loading failures separate from the owned job preflight", async () => {
    vi.mocked(serverApiGet)
      .mockResolvedValueOnce(job)
      .mockRejectedValueOnce(new Error("invitations unavailable"));
    vi.mocked(listMarketers).mockResolvedValue({ items: [], total: 0 });

    const result = await loadJobInviteInitialData(17);

    expect(result.invitations).toEqual({
      status: "error",
      message: "Current invitations could not be loaded. Refresh before sending any new ones.",
    });
    expect(result.marketers.status).toBe("success");
  });

  it("maps malformed initial invitation history to a safe read error", async () => {
    vi.mocked(serverApiGet).mockResolvedValueOnce(job).mockResolvedValueOnce([null]);
    vi.mocked(listMarketers).mockResolvedValue({ items: [], total: 0 });

    const result = await loadJobInviteInitialData(17);

    expect(result.invitations).toEqual({
      status: "error",
      message: "Current invitations could not be loaded. Refresh before sending any new ones.",
    });
  });
});
