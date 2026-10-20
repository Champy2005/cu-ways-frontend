import { afterEach, describe, expect, it } from "vitest";
import { parseJobDraft, readJobDraftSnapshot, saveJobDraft } from "@/features/jobs/job-draft";

// Mock form metadata only; persisted job IDs are assigned by the backend.
const mockValues = {
  title: "Campus campaign",
  description: "",
  budget: "8500",
  deadline: "2026-10-28",
};
const mockSurveys = [
  { id: "104", title: "Campus Mobility Study", targetResponses: 200 },
  { id: "118", title: "Green Habits 2026", targetResponses: 150 },
];
afterEach(() => sessionStorage.clear());

describe("Saved job form metadata", () => {
  it("uses a backend-assigned ID and scopes cached details to the signed-in creator", () => {
    expect(saveJobDraft(mockValues, ["104"], 41, mockSurveys, 4)).toBe(41);
    const raw = readJobDraftSnapshot("41", 4);
    expect(parseJobDraft(raw, "41", 4)?.values).toEqual(mockValues);
    expect(readJobDraftSnapshot("41", 5)).toBeNull();
    expect(parseJobDraft(raw, "41", 5)).toBeNull();
    expect(parseJobDraft(raw, "42", 4)).toBeNull();
    expect(sessionStorage.getItem("cuways-job-draft-sequence")).toBeNull();
  });

  it("retains selected survey metadata across edits without storing unselected surveys", () => {
    saveJobDraft(mockValues, ["104"], 41, mockSurveys, 4);
    expect(parseJobDraft(readJobDraftSnapshot("41", 4), "41", 4)?.surveys).toEqual([
      mockSurveys[0],
    ]);
    saveJobDraft({ ...mockValues, title: "Updated campaign" }, ["118"], 41, mockSurveys, 4);
    expect(parseJobDraft(readJobDraftSnapshot("41", 4), "41", 4)).toMatchObject({
      values: { title: "Updated campaign" },
      surveys: [mockSurveys[1]],
    });
  });

  it("rejects invalid IDs and zero selections without overwriting existing metadata", () => {
    saveJobDraft(mockValues, ["104"], 41, mockSurveys, 4);
    const raw = readJobDraftSnapshot("41", 4);
    expect(() => saveJobDraft(mockValues, [], 41, mockSurveys, 4)).toThrow("At least one survey");
    expect(() => saveJobDraft(mockValues, ["104"], 0, mockSurveys, 4)).toThrow(
      "saved job and creator ID",
    );
    expect(readJobDraftSnapshot("41", 4)).toBe(raw);
  });

  it("ignores malformed cached data", () => {
    expect(parseJobDraft("{invalid", "41", 4)).toBeNull();
    expect(parseJobDraft(null, "41", 4)).toBeNull();
  });
});
