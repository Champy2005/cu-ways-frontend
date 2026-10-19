import { describe, expect, it } from "vitest";
import {
  createSurveyValidationMessage,
  normalizeCreateSurveyInput,
  validateCreateSurveyInput,
} from "./schemas";

const required = { title: "Student experience", survey_link: "https://forms.gle/example" };
describe("survey input", () => {
  it("accepts required fields and normalizes empty optional fields to null", () => {
    expect(validateCreateSurveyInput(required)).toBe(true);
    expect(
      normalizeCreateSurveyInput({
        ...required,
        title: "  Student experience  ",
        description: " ",
        target_group: "",
        deadline: "",
      }),
    ).toEqual({
      ...required,
      description: null,
      target_group: null,
      desired_responses: null,
      deadline: null,
    });
  });
  it.each([
    null,
    [],
    {},
    { ...required, title: " " },
    { ...required, title: "x".repeat(201) },
    { ...required, survey_link: "" },
    { ...required, survey_link: "javascript:alert(1)" },
    { ...required, survey_link: "ftp://example.test" },
    { ...required, survey_link: "https://user:pass@example.test" },
    { ...required, description: 1 },
    { ...required, description: "x".repeat(5001) },
    { ...required, target_group: "x".repeat(201) },
    { ...required, target_group: [] },
    { ...required, desired_responses: 0 },
    { ...required, desired_responses: -1 },
    { ...required, desired_responses: 1.5 },
    { ...required, desired_responses: Infinity },
    { ...required, desired_responses: "50" },
    { ...required, desired_responses: 2147483648 },
    { ...required, deadline: "2026-02-30" },
    { ...required, deadline: "invalid" },
    { ...required, deadline: false },
    { ...required, user_id: 99 },
    { ...required, questions: [] },
  ])("rejects invalid input %#", (value) => {
    expect(validateCreateSurveyInput(value)).toBe(false);
  });
  it("counts Unicode characters consistently with the backend and trims whitespace", () => {
    expect(validateCreateSurveyInput({ ...required, title: " " + "🐦".repeat(200) + " " })).toBe(
      true,
    );
    expect(createSurveyValidationMessage({ ...required, title: " " })).toBe("Title is required.");
  });
  it("preserves optional metadata and converts date-only values consistently to RFC3339 UTC", () => {
    expect(
      normalizeCreateSurveyInput({
        ...required,
        desired_responses: 50,
        deadline: "2028-02-29",
        description: " Study ",
      }),
    ).toMatchObject({
      desired_responses: 50,
      deadline: "2028-02-29T00:00:00.000Z",
      description: "Study",
    });
    expect(
      normalizeCreateSurveyInput({ ...required, deadline: "2026-12-31T07:00:00+07:00" }).deadline,
    ).toBe("2026-12-31T00:00:00.000Z");
    expect(
      validateCreateSurveyInput({ ...required, desired_responses: null, deadline: null }),
    ).toBe(true);
  });
});
