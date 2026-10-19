import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadJobBriefs, saveJobBrief } from "@/features/jobs/brief-actions";
import type { JobBrief } from "@/features/jobs/project-brief";
import { ApiError } from "@/lib/api/errors";
import { serverApiGet, serverApiRequest } from "@/lib/api/server-client";
import { getSession } from "@/lib/auth/session";

vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/api/server-client", () => ({ serverApiGet: vi.fn(), serverApiRequest: vi.fn() }));

const brief: JobBrief = {
  attachment_id: 7,
  attachment_type: "Brief",
  url: "https://example.com/brief.pdf",
  upload_at: "2026-09-29T14:20:00.123456Z",
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getSession).mockResolvedValue({
    userId: 4,
    role: "user",
    expiresAt: 4_000_000_000,
    token: "mock-token",
  });
  vi.mocked(serverApiGet).mockResolvedValue([brief]);
  vi.mocked(serverApiRequest).mockResolvedValue(brief);
});

describe("Project brief API actions", () => {
  it("loads backend history in its supplied order, including sub-millisecond timestamp ordering", async () => {
    const history = [
      brief,
      { ...brief, attachment_id: 9, upload_at: "2026-09-29T14:20:00.123455Z" },
    ];
    vi.mocked(serverApiGet).mockResolvedValue(history);
    await expect(loadJobBriefs("41")).resolves.toEqual({
      status: "success",
      history,
      creatorId: 4,
    });
    expect(serverApiGet).toHaveBeenCalledExactlyOnceWith("/api/v1/jobs/41/briefs");
  });

  it("accepts an empty history", async () => {
    vi.mocked(serverApiGet).mockResolvedValue([]);
    await expect(loadJobBriefs("41")).resolves.toEqual({
      status: "success",
      history: [],
      creatorId: 4,
    });
  });

  it("requires a session for both endpoints", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    await expect(loadJobBriefs("41")).resolves.toMatchObject({
      status: "error",
      message: expect.stringContaining("Sign in again"),
    });
    await expect(saveJobBrief("41", brief.url)).resolves.toMatchObject({ status: "error" });
    expect(serverApiGet).not.toHaveBeenCalled();
    expect(serverApiRequest).not.toHaveBeenCalled();
  });

  it.each(["0", "-1", "01", "41/briefs", "2147483648", "preview-41"])(
    "rejects invalid job ID %s before requesting",
    async (id) => {
      await expect(loadJobBriefs(id)).resolves.toMatchObject({ status: "error" });
      await expect(saveJobBrief(id, brief.url)).resolves.toMatchObject({ status: "error" });
      expect(serverApiGet).not.toHaveBeenCalled();
      expect(serverApiRequest).not.toHaveBeenCalled();
    },
  );

  it.each([
    "",
    "/brief.pdf",
    "not a link",
    "javascript:alert(1)",
    "file:///brief",
    "ftp://example.com/brief",
  ])("rejects unsafe or relative URL %s", async (url) => {
    await expect(saveJobBrief("41", url)).resolves.toMatchObject({ status: "error" });
    expect(serverApiRequest).not.toHaveBeenCalled();
  });

  it.each([
    null,
    {},
    [brief, brief],
    [{ ...brief, attachment_id: "7" }],
    [{ ...brief, attachment_type: "File" }],
    [{ ...brief, url: "javascript:alert(1)" }],
    [{ ...brief, upload_at: "invalid" }],
  ])("rejects malformed history instead of showing an empty state", async (response) => {
    vi.mocked(serverApiGet).mockResolvedValue(response);
    await expect(loadJobBriefs("41")).resolves.toMatchObject({ status: "error" });
  });

  it("posts only the normalized URL and returns the saved brief without a history refresh", async () => {
    await expect(saveJobBrief("41", `  ${brief.url}  `)).resolves.toEqual({
      status: "success",
      brief,
      creatorId: 4,
    });
    expect(serverApiRequest).toHaveBeenCalledExactlyOnceWith("/api/v1/jobs/41/briefs", {
      method: "POST",
      body: JSON.stringify({ url: brief.url }),
    });
    expect(serverApiGet).not.toHaveBeenCalled();
  });

  it.each([401, 403, 404, 422])(
    "returns an actionable error for HTTP %i on read and save",
    async (status) => {
      const error = new ApiError(status, "mock_error", "internal detail must not be displayed");
      vi.mocked(serverApiGet).mockRejectedValue(error);
      vi.mocked(serverApiRequest).mockRejectedValue(error);
      for (const result of [await loadJobBriefs("41"), await saveJobBrief("41", brief.url)]) {
        expect(result).toMatchObject({ status: "error", message: expect.any(String) });
        expect(result).not.toHaveProperty("message", error.message);
      }
      expect(serverApiRequest).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    new Error("response lost"),
    new ApiError(500, "internal", "failed"),
    new ApiError(408, "timeout", "timeout"),
  ])("requires reconciliation after an uncertain write", async (error) => {
    vi.mocked(serverApiRequest).mockRejectedValue(error);
    await expect(saveJobBrief("41", brief.url)).resolves.toMatchObject({ status: "reconcile" });
    expect(serverApiRequest).toHaveBeenCalledTimes(1);
    expect(serverApiGet).not.toHaveBeenCalled();
  });

  it.each([
    null,
    { ...brief, attachment_id: 0 },
    { ...brief, url: "https://example.com/unexpected" },
    { ...brief, upload_at: "invalid" },
  ])("does not confirm malformed or mismatched POST data", async (response) => {
    vi.mocked(serverApiRequest).mockResolvedValue(response);
    await expect(saveJobBrief("41", brief.url)).resolves.toMatchObject({ status: "reconcile" });
    expect(serverApiRequest).toHaveBeenCalledTimes(1);
  });

  it("does not delay or fail a confirmed save when a history request would fail", async () => {
    vi.mocked(serverApiGet).mockRejectedValue(new Error("offline"));
    await expect(saveJobBrief("41", brief.url)).resolves.toEqual({
      status: "success",
      brief,
      creatorId: 4,
    });
    expect(serverApiRequest).toHaveBeenCalledTimes(1);
    expect(serverApiGet).not.toHaveBeenCalled();
  });
});
