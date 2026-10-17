import { afterEach, describe, expect, it, vi } from "vitest";

import { parseJobDraft, readJobDraftSnapshot, saveJobDraft } from "@/features/jobs/job-draft";
import type { JobSurveyOption } from "@/features/jobs/types";

// Mock data for these tests only; the live selector loads surveys from the API.
const mockSurveyOptions: JobSurveyOption[] = [
  { id: "104", title: "Campus Mobility Study", targetResponses: 200 },
  { id: "118", title: "Green Habits 2026", targetResponses: 150 },
  { id: "99", title: "Student Dining Pulse", targetResponses: 100 },
  { id: "87", title: "Library Experience", targetResponses: 250 },
];

const values = {
  title: "Campus campaign",
  description: "",
  budget: "8,500 fixed",
  deadline: "2026-10-28",
};
const surveyIds = ["SV-104"];

afterEach(() => {
  sessionStorage.clear();
});

describe("Job draft IDs", () => {
  it("assigns sequential numeric IDs to new jobs", () => {
    const firstId = saveJobDraft(values, surveyIds);
    const secondId = saveJobDraft(values, surveyIds);

    expect(firstId).toBe(1);
    expect(secondId).toBe(2);
    expect(parseJobDraft(readJobDraftSnapshot("1"), "1")?.id).toBe(1);
    expect(parseJobDraft(readJobDraftSnapshot("2"), "2")?.id).toBe(2);
  });

  it("preserves IDs when editing without consuming the next number", () => {
    const firstId = saveJobDraft(values, surveyIds);
    saveJobDraft(values, surveyIds);

    expect(saveJobDraft({ ...values, title: "Updated campaign" }, surveyIds, firstId)).toBe(1);
    expect(parseJobDraft(readJobDraftSnapshot("1"), "1")?.values.title).toBe("Updated campaign");
    expect(saveJobDraft(values, surveyIds)).toBe(3);
  });

  it("continues the sequence after reloading the module and removing an old draft", async () => {
    saveJobDraft(values, surveyIds);
    sessionStorage.removeItem("cuways-job-draft:1");
    vi.resetModules();
    const reloaded = await import("@/features/jobs/job-draft");

    expect(reloaded.saveJobDraft(values, surveyIds)).toBe(2);
  });

  it("keeps existing drafts when the sequence counter is missing", () => {
    saveJobDraft(values, surveyIds);
    const original = readJobDraftSnapshot("1");
    sessionStorage.removeItem("cuways-job-draft-sequence");

    expect(saveJobDraft(values, surveyIds)).toBe(2);
    expect(readJobDraftSnapshot("1")).toBe(original);
  });

  it("rejects saving zero surveys and preserves the last linked survey", () => {
    const jobId = saveJobDraft(values, surveyIds);
    const original = readJobDraftSnapshot(String(jobId));

    expect(() => saveJobDraft(values, [], jobId)).toThrow("At least one survey is required.");
    expect(readJobDraftSnapshot(String(jobId))).toBe(original);
    expect(() => saveJobDraft(values, [])).toThrow("At least one survey is required.");
    expect(saveJobDraft(values, surveyIds)).toBe(2);
  });

  it("retains real survey details across reloads and edits, without storing unselected surveys", () => {
    const id = saveJobDraft(values, ["104"], undefined, mockSurveyOptions);
    expect(parseJobDraft(readJobDraftSnapshot(String(id)), String(id))?.surveys).toEqual([
      mockSurveyOptions[0],
    ]);
    saveJobDraft({ ...values, title: "Updated campaign" }, ["104"], id);
    expect(parseJobDraft(readJobDraftSnapshot(String(id)), String(id))?.surveys).toEqual([
      mockSurveyOptions[0],
    ]);
  });
});
