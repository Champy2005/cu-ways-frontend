import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";
import { getSession } from "@/lib/auth/session";
import { serverApiGet, serverApiRequest } from "@/lib/api/server-client";
import { getJobSentInvitations } from "@/features/jobs/api";
import { listMarketers } from "@/features/marketer-discovery/api";
import { EMPTY_MARKETER_QUERY } from "@/features/marketer-discovery/schemas";
import {
  loadJobInviteMarketersPage,
  loadJobSentInvitations,
  sendJobRequests,
} from "@/features/jobs/actions";

vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/api/server-client", () => ({ serverApiGet: vi.fn(), serverApiRequest: vi.fn() }));
vi.mock("@/features/jobs/api", () => ({ getJobSentInvitations: vi.fn() }));
vi.mock("@/features/marketer-discovery/api", () => ({ listMarketers: vi.fn() }));

const sentRequest = (
  marketerId: number,
  requestStatus: "Pending" | "Accepted" | "Declined" | "Closed",
) => ({
  job_request_id: marketerId + 100,
  job_id: 12,
  marketer_id: marketerId,
  request_status: requestStatus,
  created_at: "2026-10-01T10:00:00Z",
  responded_at: requestStatus === "Pending" ? null : "2026-10-02T10:00:00Z",
  marketer_name: `Marketer ${marketerId}`,
});

const createdRequest = (marketerId: number) => ({
  job_request_id: marketerId + 200,
  job_id: 12,
  marketer_id: marketerId,
  request_status: "Pending" as const,
  created_at: "2026-10-03T10:00:00Z",
  responded_at: null,
});

describe("job invitation server actions", () => {
  beforeEach(() => {
    vi.mocked(getSession).mockResolvedValue({
      userId: 4,
      role: "user",
      expiresAt: 4_000_000_000,
      token: "session-token",
    });
    vi.mocked(serverApiGet).mockReset();
    vi.mocked(serverApiRequest).mockReset();
    vi.mocked(getJobSentInvitations).mockReset();
    vi.mocked(listMarketers).mockReset();
  });

  it("returns the JobRequest records created by the POST", async () => {
    const requests = [createdRequest(21), createdRequest(22)];
    vi.mocked(serverApiRequest).mockResolvedValue(requests);

    const result = await sendJobRequests(12, [21, 22]);

    expect(serverApiRequest).toHaveBeenCalledWith("/api/v1/jobs/12/requests", {
      method: "POST",
      body: JSON.stringify({ marketer_ids: [21, 22] }),
    });
    expect(result).toEqual({ status: "success", requests });
  });

  it.each([
    ["a null row", [null], [21]],
    ["a row for another job", [{ ...createdRequest(21), job_id: 99 }], [21]],
    [
      "a non-pending status",
      [{ ...createdRequest(21), request_status: "Accepted", responded_at: "2026-10-04" }],
      [21],
    ],
    ["a responded pending row", [{ ...createdRequest(21), responded_at: "2026-10-04" }], [21]],
    [
      "duplicate request IDs",
      [createdRequest(21), { ...createdRequest(22), job_request_id: 221 }],
      [21, 22],
    ],
  ])(
    "requires a complete pending response before reporting success (%s)",
    async (_label, response, selectedIds) => {
      vi.mocked(serverApiRequest).mockResolvedValue(response as never);

      await expect(sendJobRequests(12, selectedIds)).resolves.toMatchObject({
        status: "reconcile",
        message: expect.stringContaining("server accepted the request"),
      });
    },
  );

  it("does not call the backend when the job or selection is invalid", async () => {
    const result = await sendJobRequests(-2, []);

    expect(serverApiRequest).not.toHaveBeenCalled();
    expect(result.status).toBe("error");
  });

  it("rejects duplicate marketer IDs before sending", async () => {
    const result = await sendJobRequests(12, [21, 21]);

    expect(serverApiRequest).not.toHaveBeenCalled();
    expect(result.status).toBe("error");
  });

  it("refreshes after a conflict and intersects active invitations with the captured selection", async () => {
    vi.mocked(serverApiRequest).mockRejectedValue(
      new ApiError(409, "job_conflict", "an active request already exists"),
    );
    vi.mocked(getJobSentInvitations).mockResolvedValue([
      sentRequest(21, "Pending"),
      sentRequest(22, "Declined"),
      sentRequest(23, "Accepted"),
    ]);

    const result = await sendJobRequests(12, [21, 22]);

    expect(getJobSentInvitations).toHaveBeenCalledWith(12);
    expect(result).toEqual({
      status: "duplicate",
      refreshStatus: "success",
      sentInvitations: [
        sentRequest(21, "Pending"),
        sentRequest(22, "Declined"),
        sentRequest(23, "Accepted"),
      ],
      conflictingMarketerIds: [21],
      message: expect.stringContaining("active invitation"),
    });
  });

  it("marks a conflict refresh as failed without guessing which selected IDs are active", async () => {
    vi.mocked(serverApiRequest).mockRejectedValue(
      new ApiError(409, "job_conflict", "an active request already exists"),
    );
    vi.mocked(getJobSentInvitations).mockRejectedValue(new Error("network down"));

    const result = await sendJobRequests(12, [21, 22]);

    expect(result).toEqual({
      status: "duplicate",
      refreshStatus: "error",
      message: expect.stringContaining("could not be refreshed"),
    });
  });

  it("marks a malformed conflict refresh as failed without guessing active IDs", async () => {
    vi.mocked(serverApiRequest).mockRejectedValue(
      new ApiError(409, "job_conflict", "an active request already exists"),
    );
    vi.mocked(getJobSentInvitations).mockResolvedValue([null] as never);

    await expect(sendJobRequests(12, [21, 22])).resolves.toMatchObject({
      status: "duplicate",
      refreshStatus: "error",
      message: expect.stringContaining("could not be refreshed"),
    });
  });

  it("requires a session and valid job ID when refreshing invitation history", async () => {
    vi.mocked(getJobSentInvitations).mockResolvedValue([sentRequest(21, "Pending")]);

    const loaded = await loadJobSentInvitations(12);
    const invalid = await loadJobSentInvitations("12");

    expect(loaded).toEqual({ status: "success", items: [sentRequest(21, "Pending")] });
    expect(invalid.status).toBe("error");
    expect(getJobSentInvitations).toHaveBeenCalledTimes(1);
    vi.mocked(getSession).mockResolvedValue(null);
    const expired = await loadJobSentInvitations(12);
    expect(expired).toMatchObject({ status: "error", message: expect.stringContaining("session") });
  });

  it("returns an error when invitation history contains malformed records", async () => {
    vi.mocked(getJobSentInvitations).mockResolvedValue([null] as never);

    await expect(loadJobSentInvitations(12)).resolves.toMatchObject({ status: "error" });
  });

  it("maps an active duplicate response to a selection-specific message", async () => {
    vi.mocked(serverApiRequest).mockRejectedValue(
      new ApiError(409, "job_conflict", "an active request already exists"),
    );
    vi.mocked(getJobSentInvitations).mockResolvedValue([sentRequest(21, "Accepted")]);

    const result = await sendJobRequests(12, [21]);

    expect(result).toMatchObject({ status: "duplicate", conflictingMarketerIds: [21] });
  });

  it("returns an expired-session message without making a backend request", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const result = await sendJobRequests(12, [21]);

    expect(serverApiRequest).not.toHaveBeenCalled();
    expect(result).toMatchObject({ status: "error", message: expect.stringContaining("session") });
  });

  it("loads a requested marketer page and returns only invitation display fields", async () => {
    vi.mocked(listMarketers).mockResolvedValue({
      items: [
        {
          marketer_id: 21,
          display_name: "Mali S.",
          headline: "Data Collection",
          is_verified: false,
          average_rating: 4.8,
          rating_count: 12,
          email: "private@example.com",
        } as never,
      ],
      total: 135,
    });

    const result = await loadJobInviteMarketersPage(2);

    expect(listMarketers).toHaveBeenCalledWith(EMPTY_MARKETER_QUERY, 2);
    expect(result).toEqual({
      status: "success",
      items: [
        {
          marketer_id: 21,
          display_name: "Mali S.",
          headline: "Data Collection",
          average_rating: 4.8,
          rating_count: 12,
        },
      ],
      page: 2,
      pageSize: 100,
      total: 135,
      keyword: "",
    });
  });

  it("passes the search keyword to the backend across all marketer pages", async () => {
    vi.mocked(listMarketers).mockResolvedValue({ items: [], total: 0 });

    const result = await loadJobInviteMarketersPage(1, "data collection");

    expect(listMarketers).toHaveBeenCalledWith(
      { ...EMPTY_MARKETER_QUERY, q: "data collection" },
      1,
    );
    expect(result).toMatchObject({ status: "success", keyword: "data collection", total: 0 });
  });

  it("rejects an invalid page before requesting marketers", async () => {
    const result = await loadJobInviteMarketersPage("2");

    expect(listMarketers).not.toHaveBeenCalled();
    expect(result.status).toBe("error");
  });

  it("rejects a keyword beyond the backend's supported limit", async () => {
    const result = await loadJobInviteMarketersPage(1, "x".repeat(101));

    expect(listMarketers).not.toHaveBeenCalled();
    expect(result.status).toBe("error");
  });
});
