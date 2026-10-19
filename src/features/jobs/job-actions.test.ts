import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  addJobSurveys,
  createPendingJob,
  loadSavedJob,
  removeJobSurvey,
  saveJobSurveySelection,
} from "@/features/jobs/job-actions";
import { ApiError } from "@/lib/api/errors";
import { serverApiGet, serverApiRequest } from "@/lib/api/server-client";
import { getSession } from "@/lib/auth/session";

vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/api/server-client", () => ({ serverApiGet: vi.fn(), serverApiRequest: vi.fn() }));
vi.mock("@/features/marketer-discovery/api", () => ({ listMarketers: vi.fn() }));

// Mock API data, scoped to these tests. Requests never contact a live backend.
const mockSurveys = [
  { survey_id: 104, title: "Campus Mobility Study" },
  { survey_id: 118, title: "Green Habits 2026" },
  { survey_id: 87, title: "Library Experience" },
];
let mockLinkedIds: number[];
const mockJob = () => ({
  job_id: 41,
  job_status: "Pending" as const,
  created_at: "2026-10-01T10:00:00Z",
  surveys: mockSurveys.filter((survey) => mockLinkedIds.includes(survey.survey_id)),
});
const mockCreatedJob = {
  job_id: 41,
  user_id: 4,
  accepted_offer_id: null,
  job_status: "Pending",
  created_at: "2026-10-01T10:00:00Z",
  survey_ids: [104, 118],
};

beforeEach(() => {
  vi.resetAllMocks();
  mockLinkedIds = [104, 118];
  vi.mocked(getSession).mockResolvedValue({
    userId: 4,
    role: "user",
    expiresAt: 4_000_000_000,
    token: "mock-token",
  });
  vi.mocked(serverApiGet).mockImplementation(async () => mockJob() as never);
  vi.mocked(serverApiRequest).mockImplementation(async (path, init) => {
    const id = Number(path.split("/").at(-1));
    if (init?.method === "POST") mockLinkedIds = [...new Set([...mockLinkedIds, id])];
    if (init?.method === "DELETE") mockLinkedIds = mockLinkedIds.filter((value) => value !== id);
    return {} as never;
  });
});

describe("Saved job API actions", () => {
  it("creates a Pending job through one POST and uses the backend ID", async () => {
    vi.mocked(serverApiRequest).mockResolvedValue(mockCreatedJob);
    await expect(createPendingJob(["104", "118"])).resolves.toEqual({
      status: "success",
      jobId: 41,
      creatorId: 4,
    });
    expect(serverApiRequest).toHaveBeenCalledExactlyOnceWith("/api/v1/jobs", {
      method: "POST",
      body: JSON.stringify({ survey_ids: [104, 118] }),
    });
  });

  it.each([[], ["0"], ["SV-104"], ["01"], ["104", "104"], ["2147483648"]])(
    "rejects invalid or duplicate creation selections %j before posting",
    async (...values) => {
      await expect(createPendingJob(values as string[])).resolves.toMatchObject({
        status: "error",
      });
      expect(serverApiRequest).not.toHaveBeenCalled();
    },
  );

  it.each([
    { ...mockCreatedJob, job_id: "41" },
    { ...mockCreatedJob, user_id: 5 },
    { ...mockCreatedJob, job_status: "Accepted" },
    { ...mockCreatedJob, accepted_offer_id: 9 },
    { ...mockCreatedJob, survey_ids: [104, 104] },
    null,
  ])("does not claim success for an invalid creation response", async (response) => {
    vi.mocked(serverApiRequest).mockResolvedValue(response);
    await expect(createPendingJob(["104", "118"])).resolves.toMatchObject({ status: "reconcile" });
    expect(serverApiRequest).toHaveBeenCalledTimes(1);
  });

  it.each([401, 403, 404, 422])(
    "returns a retryable creation error for documented HTTP %i failures",
    async (status) => {
      vi.mocked(serverApiRequest).mockRejectedValue(
        new ApiError(status, "request_failed", "Failed"),
      );

      await expect(createPendingJob(["104"])).resolves.toMatchObject({ status: "error" });
      expect(serverApiRequest).toHaveBeenCalledTimes(1);
    },
  );

  it.each([400, 408, 409, 418, 429, 499, 500, 503])(
    "requires reconciliation after undocumented HTTP %i creation failures",
    async (status) => {
      vi.mocked(serverApiRequest).mockRejectedValue(
        new ApiError(status, "request_failed", "Failed"),
      );

      await expect(createPendingJob(["104"])).resolves.toMatchObject({ status: "reconcile" });
      expect(serverApiRequest).toHaveBeenCalledTimes(1);
    },
  );

  it("requires authentication for reads, creation, additions, replacements, and removals", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    for (const operation of [
      () => loadSavedJob("41"),
      () => createPendingJob(["104"]),
      () => addJobSurveys("41", ["87"]),
      () => saveJobSurveySelection("41", ["87"]),
      () => removeJobSurvey("41", "104"),
    ]) {
      await expect(operation()).resolves.toMatchObject({
        status: "error",
        message: expect.stringContaining("Sign in again"),
      });
    }
    expect(serverApiGet).not.toHaveBeenCalled();
    expect(serverApiRequest).not.toHaveBeenCalled();
  });

  it("checks access to the saved job before changing links", async () => {
    vi.mocked(serverApiGet).mockRejectedValue(new ApiError(403, "forbidden", "Forbidden"));
    await expect(addJobSurveys("41", ["87"])).resolves.toMatchObject({ status: "error" });
    await expect(removeJobSurvey("41", "104")).resolves.toMatchObject({ status: "error" });
    expect(serverApiRequest).not.toHaveBeenCalled();
  });

  it("adds only new links, preserves other existing links, and reloads the saved result", async () => {
    await expect(addJobSurveys("41", ["104", "87"])).resolves.toMatchObject({
      status: "success",
      job: { surveys: mockSurveys },
    });
    expect(serverApiRequest).toHaveBeenCalledExactlyOnceWith("/api/v1/jobs/41/surveys/87", {
      method: "POST",
    });
    expect(serverApiGet).toHaveBeenCalledTimes(2);
    await addJobSurveys("41", ["104", "87"]);
    expect(serverApiRequest).toHaveBeenCalledTimes(1);
  });

  it("deletes only the link and rejects removing the last remaining survey", async () => {
    await expect(removeJobSurvey("41", "104")).resolves.toMatchObject({
      status: "success",
      job: { surveys: [mockSurveys[1]] },
    });
    expect(serverApiRequest).toHaveBeenCalledExactlyOnceWith("/api/v1/jobs/41/surveys/104", {
      method: "DELETE",
    });
    await expect(removeJobSurvey("41", "118")).resolves.toMatchObject({
      status: "success",
      notice: expect.stringContaining("Keep at least one survey"),
    });
    expect(serverApiRequest).toHaveBeenCalledTimes(1);
  });

  it("replaces selections by adding new links before removing old ones", async () => {
    mockLinkedIds = [104];
    await expect(saveJobSurveySelection("41", ["87"])).resolves.toMatchObject({
      status: "success",
      job: { surveys: [mockSurveys[2]] },
    });
    expect(vi.mocked(serverApiRequest).mock.calls).toEqual([
      ["/api/v1/jobs/41/surveys/87", { method: "POST" }],
      ["/api/v1/jobs/41/surveys/104", { method: "DELETE" }],
    ]);
    vi.mocked(serverApiRequest).mockClear();
    await expect(saveJobSurveySelection("41", [])).resolves.toMatchObject({ status: "error" });
    expect(serverApiRequest).not.toHaveBeenCalled();
  });

  it("reconciles concurrent duplicate additions and last-survey conflicts from the backend", async () => {
    vi.mocked(serverApiRequest).mockImplementationOnce(async () => {
      mockLinkedIds.push(87);
      throw new ApiError(409, "job_conflict", "Already linked");
    });
    await expect(addJobSurveys("41", ["87"])).resolves.toMatchObject({
      status: "success",
      job: { surveys: mockSurveys },
      notice: expect.any(String),
    });
    vi.mocked(serverApiRequest).mockImplementationOnce(async () => {
      mockLinkedIds = [104];
      throw new ApiError(409, "job_conflict", "Last survey");
    });
    await expect(removeJobSurvey("41", "104")).resolves.toMatchObject({
      status: "success",
      job: { surveys: [mockSurveys[0]] },
      notice: expect.stringContaining("at least one"),
    });
  });

  it("retains successful additions when a later request fails and reloads the actual links", async () => {
    mockLinkedIds = [104];
    vi.mocked(serverApiRequest)
      .mockImplementationOnce(async () => {
        mockLinkedIds.push(118);
        return {} as never;
      })
      .mockRejectedValueOnce(new Error("offline"));
    await expect(addJobSurveys("41", ["118", "87"])).resolves.toMatchObject({
      status: "success",
      job: { surveys: mockSurveys.slice(0, 2) },
      notice: expect.any(String),
    });
    expect(serverApiRequest).toHaveBeenCalledTimes(2);
  });

  it.each([404, 422])(
    "reloads saved links after the first addition succeeds and a later HTTP %i fails",
    async (status) => {
      mockLinkedIds = [104];
      vi.mocked(serverApiRequest)
        .mockImplementationOnce(async () => {
          mockLinkedIds.push(118);
          return {} as never;
        })
        .mockRejectedValueOnce(new ApiError(status, "request_failed", "Failed"));

      await expect(addJobSurveys("41", ["118", "87"])).resolves.toMatchObject({
        status: "success",
        job: { surveys: mockSurveys.slice(0, 2) },
        notice: expect.any(String),
      });
      expect(serverApiRequest).toHaveBeenCalledTimes(2);
      expect(serverApiGet).toHaveBeenCalledTimes(2);
    },
  );

  it("explains that saved links must be reloaded when partial-change readback fails", async () => {
    mockLinkedIds = [104];
    vi.mocked(serverApiGet)
      .mockImplementationOnce(async () => mockJob() as never)
      .mockRejectedValueOnce(new ApiError(503, "unavailable", "Unavailable"));
    vi.mocked(serverApiRequest)
      .mockImplementationOnce(async () => {
        mockLinkedIds.push(118);
        return {} as never;
      })
      .mockRejectedValueOnce(new ApiError(422, "invalid_request", "Invalid selection"));

    await expect(addJobSurveys("41", ["118", "87"])).resolves.toMatchObject({
      status: "error",
      message: expect.stringContaining("Reload the job to check its saved surveys"),
    });
    expect(serverApiGet).toHaveBeenCalledTimes(2);
  });

  it("preserves definitive validation errors when no survey write has succeeded", async () => {
    vi.mocked(serverApiRequest).mockRejectedValueOnce(
      new ApiError(422, "invalid_request", "Invalid selection"),
    );

    await expect(addJobSurveys("41", ["87"])).resolves.toMatchObject({
      status: "error",
      message: expect.stringContaining("Select at least one valid survey"),
    });
    expect(serverApiGet).toHaveBeenCalledOnce();
  });

  it("handles inaccessible surveys without claiming a successful change", async () => {
    vi.mocked(serverApiRequest).mockRejectedValue(new ApiError(403, "forbidden", "Foreign survey"));
    await expect(addJobSurveys("41", ["87"])).resolves.toMatchObject({
      status: "error",
      message: expect.stringContaining("do not own"),
    });
  });

  it("does not retry creation automatically after a lost response", async () => {
    vi.mocked(serverApiRequest).mockRejectedValue(new Error("response lost"));
    await expect(createPendingJob(["104"])).resolves.toMatchObject({ status: "reconcile" });
    expect(serverApiRequest).toHaveBeenCalledTimes(1);
  });

  it("requires a real numeric job ID and rejects malformed job data", async () => {
    await expect(loadSavedJob("preview-41")).resolves.toMatchObject({ status: "error" });
    expect(serverApiGet).not.toHaveBeenCalled();
    for (const response of [
      null,
      { ...mockJob(), job_id: 42 },
      { ...mockJob(), surveys: [] },
      { ...mockJob(), surveys: [mockSurveys[0], mockSurveys[0]] },
    ]) {
      vi.mocked(serverApiGet).mockResolvedValueOnce(response);
      await expect(loadSavedJob("41")).resolves.toMatchObject({ status: "error" });
    }
    expect(serverApiRequest).not.toHaveBeenCalled();
  });
});
