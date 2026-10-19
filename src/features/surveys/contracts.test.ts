import { describe, expect, it } from "vitest";
import { readSurvey, readSurveys } from "./contracts";
import { savedSurvey } from "./test-fixtures";

describe("survey response contracts", () => {
  it("rejects incomplete payloads and duplicate IDs", () => {
    expect(() => readSurvey({ survey_id: 1 })).toThrow("could not be confirmed");
    expect(() => readSurveys([savedSurvey, savedSurvey])).toThrow("could not be confirmed");
    expect(() => readSurveys(null)).toThrow("could not be confirmed");
  });
  it("strips unknown fields and supports omitted optional metadata", () => {
    expect(readSurvey({ ...savedSurvey, secret: "hidden" })).toEqual(savedSurvey);
    expect(
      readSurvey({
        survey_id: 1,
        user_id: 2,
        title: "Title",
        survey_link: "legacy link",
        created_at: savedSurvey.created_at,
      }),
    ).toMatchObject({
      description: null,
      target_group: null,
      desired_responses: null,
      deadline: null,
    });
  });
});
