import { describe, expect, it } from "vitest";

import {
  createSurveyValidationMessage,
  normalizeCreateSurveyInput,
  validateCreateSurveyInput,
} from "./schemas";

describe("Survey validation & normalization schemas", () => {
  it("rejects input when title is missing or empty", () => {
    expect(validateCreateSurveyInput({ title: "", survey_link: "https://forms.google.com/xyz" })).toBe(false);
    expect(validateCreateSurveyInput({ title: "   ", survey_link: "https://forms.google.com/xyz" })).toBe(false);
    expect(createSurveyValidationMessage({ title: "", survey_link: "https://forms.google.com/xyz" })).toBe(
      "Title is required."
    );
  });

  it("rejects input when survey_link is missing or empty", () => {
    expect(validateCreateSurveyInput({ title: "My Survey", survey_link: "" })).toBe(false);
    expect(validateCreateSurveyInput({ title: "My Survey", survey_link: "   " })).toBe(false);
    expect(createSurveyValidationMessage({ title: "My Survey", survey_link: "" })).toBe(
      "Survey link (e.g. Google Form link) is required."
    );
  });

  it("accepts valid input with required fields only", () => {
    const input = { title: "Customer Feedback", survey_link: "https://forms.google.com/123" };
    expect(validateCreateSurveyInput(input)).toBe(true);
    expect(createSurveyValidationMessage(input)).toBeNull();
  });

  it("normalizes empty optional fields to null", () => {
    const raw = {
      title: "  Student Experience Survey  ",
      survey_link: "  https://forms.gle/abc  ",
      description: "   ",
      target_group: "",
      desired_responses: undefined as unknown as number,
      deadline: "",
    };

    const normalized = normalizeCreateSurveyInput(raw);
    expect(normalized.title).toBe("Student Experience Survey");
    expect(normalized.survey_link).toBe("https://forms.gle/abc");
    expect(normalized.description).toBeNull();
    expect(normalized.target_group).toBeNull();
    expect(normalized.desired_responses).toBeNull();
    expect(normalized.deadline).toBeNull();
  });

  it("preserves valid optional fields during normalization", () => {
    const raw = {
      title: "Market Research",
      survey_link: "https://forms.gle/xyz",
      description: "A detailed research survey",
      target_group: "University Students",
      desired_responses: 50,
      deadline: "2026-12-31T23:59:59.000Z",
    };

    const normalized = normalizeCreateSurveyInput(raw);
    expect(normalized.description).toBe("A detailed research survey");
    expect(normalized.target_group).toBe("University Students");
    expect(normalized.desired_responses).toBe(50);
    expect(normalized.deadline).toBe("2026-12-31T23:59:59.000Z");
  });
});
