import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadJobSurveys } from "@/features/jobs/actions";
import type { JobSurveyOption } from "@/features/jobs/types";
import { ApiError } from "@/lib/api/errors";
import type { components } from "@/lib/api/generated/backend";
import { serverApiGet } from "@/lib/api/server-client";
import { getSession } from "@/lib/auth/session";

// Mock data for these tests only; the live selector loads surveys from the API.
const mockSurveyOptions: JobSurveyOption[] = [
  { id: "104", title: "Campus Mobility Study", targetResponses: 200 },
  { id: "118", title: "Green Habits 2026", targetResponses: 150 },
  { id: "99", title: "Student Dining Pulse", targetResponses: 100 },
  { id: "87", title: "Library Experience", targetResponses: 250 },
];

const mockApiSurveys: components["schemas"]["Survey"][] = mockSurveyOptions.map((survey) => ({
  survey_id: Number(survey.id),
  user_id: 4,
  title: survey.title,
  survey_link: `https://example.test/surveys/${survey.id}`,
  desired_responses: survey.targetResponses,
  created_at: "2026-10-01T10:00:00Z",
}));

vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/api/server-client", () => ({ serverApiGet: vi.fn(), serverApiRequest: vi.fn() }));
vi.mock("@/features/marketer-discovery/api", () => ({ listMarketers: vi.fn() }));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getSession).mockResolvedValue({
    userId: 4,
    role: "user",
    expiresAt: 4_000_000_000,
    token: "test-token",
  });
});

describe("Creator survey loading", () => {
  it("calls the existing owned-surveys API and preserves real numeric IDs as selection values", async () => {
    vi.mocked(serverApiGet).mockResolvedValue(mockApiSurveys);
    await expect(loadJobSurveys()).resolves.toEqual({
      status: "success",
      surveys: mockSurveyOptions,
    });
    expect(serverApiGet).toHaveBeenCalledExactlyOnceWith("/api/v1/me/surveys");
  });

  it("keeps an empty list and unspecified targets truthful", async () => {
    vi.mocked(serverApiGet)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { ...mockApiSurveys[0], desired_responses: null },
        { ...mockApiSurveys[1], desired_responses: undefined },
      ]);
    await expect(loadJobSurveys()).resolves.toEqual({ status: "success", surveys: [] });
    await expect(loadJobSurveys()).resolves.toMatchObject({
      status: "success",
      surveys: [
        { id: "104", targetResponses: null },
        { id: "118", targetResponses: null },
      ],
    });
    expect(serverApiGet).toHaveBeenCalledTimes(2);
  });

  it("requires authentication before requesting surveys", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    await expect(loadJobSurveys()).resolves.toMatchObject({
      status: "error",
      message: expect.stringContaining("Sign in again"),
    });
    expect(serverApiGet).not.toHaveBeenCalled();
  });

  it.each([
    [401, "Sign in again"],
    [403, "Creator access is required"],
    [503, "Please try again"],
  ])("shows useful feedback for HTTP %s", async (status, message) => {
    vi.mocked(serverApiGet).mockRejectedValue(
      new ApiError(status, "request_failed", "upstream error"),
    );
    await expect(loadJobSurveys()).resolves.toMatchObject({
      status: "error",
      message: expect.stringContaining(message),
    });
  });

  it.each([
    ["a network failure", new Error("offline")],
    ["a malformed response", {}],
    ["a null row", [null]],
    ["an invalid ID", [{ ...mockApiSurveys[0], survey_id: "SV-104" }]],
    ["an empty title", [{ ...mockApiSurveys[0], title: " " }]],
    ["an invalid response target", [{ ...mockApiSurveys[0], desired_responses: -1 }]],
    ["duplicate IDs", [mockApiSurveys[0], mockApiSurveys[0]]],
  ])("returns an error without mock surveys for %s", async (_name, response) => {
    if (response instanceof Error) vi.mocked(serverApiGet).mockRejectedValue(response);
    else vi.mocked(serverApiGet).mockResolvedValue(response);
    await expect(loadJobSurveys()).resolves.toEqual({
      status: "error",
      message: "Your surveys could not be loaded. Please try again.",
    });
  });
});
