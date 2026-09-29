import type { CreateSurveyRequest } from "@/features/surveys/types";

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function normalizeOptionalString(value: unknown): string | null {
  if (!isString(value)) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeOptionalNumber(value: unknown): number | null {
  if (typeof value === "number" && !isNaN(value) && value >= 0) {
    return value;
  }
  if (isString(value) && value.trim().length > 0) {
    const parsed = Number(value);
    if (!isNaN(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return null;
}

function normalizeOptionalDeadline(value: unknown): string | null {
  if (!isString(value) || value.trim().length === 0) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date.toISOString();
}

export function normalizeCreateSurveyInput(input: CreateSurveyRequest): CreateSurveyRequest {
  return {
    title: input.title ? input.title.trim() : "",
    survey_link: input.survey_link ? input.survey_link.trim() : "",
    description: normalizeOptionalString(input.description),
    target_group: normalizeOptionalString(input.target_group),
    desired_responses: normalizeOptionalNumber(input.desired_responses),
    deadline: normalizeOptionalDeadline(input.deadline),
  };
}

export function validateCreateSurveyInput(value: unknown): value is CreateSurveyRequest {
  if (!value || typeof value !== "object") return false;
  const input = value as Record<string, unknown>;

  if (!isString(input.title) || input.title.trim().length === 0 || input.title.length > 200) {
    return false;
  }

  if (!isString(input.survey_link) || input.survey_link.trim().length === 0) {
    return false;
  }

  return true;
}

export function createSurveyValidationMessage(input: Partial<CreateSurveyRequest>): string | null {
  if (!input.title || !isString(input.title) || input.title.trim().length === 0) {
    return "Title is required.";
  }
  if (input.title.length > 200) {
    return "Title must not exceed 200 characters.";
  }
  if (!input.survey_link || !isString(input.survey_link) || input.survey_link.trim().length === 0) {
    return "Survey link (e.g. Google Form link) is required.";
  }
  if (input.target_group && isString(input.target_group) && input.target_group.length > 200) {
    return "Target demographic must not exceed 200 characters.";
  }
  return null;
}
