import { isRecord } from "@/lib/api/envelope";
import { ApiError } from "@/lib/api/errors";
import { isSurveyId, validSurveyDeadline } from "./schemas";
import type { Survey } from "./types";

function invalidSurvey(): never {
  throw new ApiError(
    502,
    "invalid_backend_response",
    "Survey data could not be confirmed. Check your surveys before creating another record.",
  );
}

function nullableText(value: unknown): value is string | null | undefined {
  return value == null || typeof value === "string";
}

export function readSurvey(value: unknown): Survey {
  if (
    !isRecord(value) ||
    !isSurveyId(value.survey_id) ||
    !isSurveyId(value.user_id) ||
    typeof value.title !== "string" ||
    !value.title.trim() ||
    typeof value.survey_link !== "string" ||
    !value.survey_link.trim() ||
    !nullableText(value.description) ||
    !nullableText(value.target_group) ||
    (value.desired_responses != null && !isSurveyId(value.desired_responses)) ||
    (value.deadline != null && !validSurveyDeadline(value.deadline)) ||
    !validSurveyDeadline(value.created_at)
  )
    return invalidSurvey();
  return {
    survey_id: value.survey_id,
    user_id: value.user_id,
    title: value.title,
    survey_link: value.survey_link,
    description: value.description ?? null,
    target_group: value.target_group ?? null,
    desired_responses: value.desired_responses ?? null,
    deadline: value.deadline ?? null,
    created_at: value.created_at,
  } as Survey;
}

export function readSurveys(value: unknown): Survey[] {
  if (!Array.isArray(value)) return invalidSurvey();
  const ids = new Set<number>();
  return value.map((item: unknown) => {
    const survey = readSurvey(item);
    if (ids.has(survey.survey_id)) return invalidSurvey();
    ids.add(survey.survey_id);
    return survey;
  });
}
