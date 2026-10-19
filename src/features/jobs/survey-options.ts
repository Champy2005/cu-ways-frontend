import type { components } from "@/lib/api/generated/backend";
import type { JobSurveyOption } from "@/features/jobs/types";

function isPositiveId(value: unknown): value is number {
  return (
    typeof value === "number" && Number.isSafeInteger(value) && value > 0 && value <= 2_147_483_647
  );
}

function isTargetResponses(value: unknown): value is number | null {
  return value === null || isPositiveId(value);
}

export function isJobSurveyOption(value: unknown): value is JobSurveyOption {
  if (typeof value !== "object" || value === null) return false;
  const survey = value as Partial<JobSurveyOption>;
  return (
    typeof survey.id === "string" &&
    isPositiveId(Number(survey.id)) &&
    String(Number(survey.id)) === survey.id &&
    typeof survey.title === "string" &&
    survey.title.trim().length > 0 &&
    isTargetResponses(survey.targetResponses)
  );
}

export function toJobSurveyOptions(value: unknown): JobSurveyOption[] {
  if (!Array.isArray(value)) throw new Error("The surveys response was invalid.");
  const ids = new Set<number>();
  return value.map((item: unknown) => {
    if (typeof item !== "object" || item === null)
      throw new Error("The surveys response was invalid.");
    const survey = item as Partial<components["schemas"]["Survey"]>;
    if (
      !isPositiveId(survey.survey_id) ||
      ids.has(survey.survey_id) ||
      typeof survey.title !== "string" ||
      !survey.title.trim() ||
      !isTargetResponses(survey.desired_responses ?? null)
    )
      throw new Error("The surveys response was invalid.");
    ids.add(survey.survey_id);
    return {
      id: String(survey.survey_id),
      title: survey.title,
      targetResponses: survey.desired_responses ?? null,
    };
  });
}

export function surveyDisplayId(id: string): string {
  return /^\d+$/.test(id) ? `SV-${id.padStart(3, "0")}` : id;
}
