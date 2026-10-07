import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";
import { getSession } from "@/lib/auth/session";
import { serverApiRequest } from "@/lib/api/server-client";
import { listMarketers } from "@/features/marketer-discovery/api";
import { EMPTY_MARKETER_QUERY } from "@/features/marketer-discovery/schemas";
import { loadJobInviteMarketersPage, sendJobRequests } from "@/features/jobs/actions";

vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/api/server-client", () => ({ serverApiRequest: vi.fn() }));
vi.mock("@/features/marketer-discovery/api", () => ({ listMarketers: vi.fn() }));

describe("sendJobRequests", () => {
  beforeEach(() => {
    vi.mocked(getSession).mockResolvedValue({
      userId: 4,
      role: "user",
      expiresAt: 4_000_000_000,
      token: "session-token",
    });
    vi.mocked(serverApiRequest).mockReset();
    vi.mocked(listMarketers).mockReset();
  });

  it("sends all selected marketers in one backend request", async () => {
    vi.mocked(serverApiRequest).mockResolvedValue([{ job_request_id: 1 }, { job_request_id: 2 }]);

    const result = await sendJobRequests(12, [21, 22]);

    expect(serverApiRequest).toHaveBeenCalledWith("/api/v1/jobs/12/requests", {
      method: "POST",
      body: JSON.stringify({ marketer_ids: [21, 22] }),
    });
    expect(result).toEqual({ status: "success", createdCount: 2 });
  });

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

  it("maps an active duplicate response to a selection-specific alert", async () => {
    vi.mocked(serverApiRequest).mockRejectedValue(
      new ApiError(409, "job_conflict", "an active request already exists"),
    );

    const result = await sendJobRequests(12, [21]);

    expect(result).toMatchObject({ status: "duplicate" });
    expect(result.status === "duplicate" && result.message).toContain("active request");
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
