import { isRecord } from "@/lib/api/envelope";
import type { CreateSurveyRequest } from "./types";

const fields = [
  "title",
  "survey_link",
  "description",
  "target_group",
  "desired_responses",
  "deadline",
];

export function isSurveyId(value: unknown): value is number {
  return (
    typeof value === "number" && Number.isInteger(value) && value > 0 && value <= 2_147_483_647
  );
}

export function safeSurveyUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function optionalText(value: unknown, max: number): boolean {
  return value == null || (typeof value === "string" && [...value.trim()].length <= max);
}

export function validSurveyDeadline(value: unknown): value is string {
  if (typeof value !== "string") return false;
  // Reject rolled-over dates rather than silently changing the user's deadline.
  const datePart = value.slice(0, 10);
  const calendarDate = new Date(`${datePart}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(datePart) ||
    !Number.isFinite(calendarDate.getTime()) ||
    calendarDate.toISOString().slice(0, 10) !== datePart
  )
    return false;
  return (
    value === datePart ||
    (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(value) &&
      Number.isFinite(Date.parse(value)))
  );
}

export function createSurveyValidationMessage(input: object): string | null {
  const fields = input as Record<string, unknown>;
  if (typeof fields.title !== "string" || !fields.title.trim()) return "Title is required.";
  if ([...fields.title.trim()].length > 200) return "Title must not exceed 200 characters.";
  if (typeof fields.survey_link !== "string" || !fields.survey_link.trim())
    return "Survey link is required.";
  if (!safeSurveyUrl(fields.survey_link))
    return "Enter a full HTTP or HTTPS survey link without credentials.";
  if (!optionalText(fields.description, 5000))
    return "Description must not exceed 5000 characters.";
  if (!optionalText(fields.target_group, 200))
    return "Target demographic must not exceed 200 characters.";
  if (fields.desired_responses != null && !isSurveyId(fields.desired_responses))
    return "Desired responses must be a whole number from 1 to 2147483647.";
  if (fields.deadline != null && fields.deadline !== "" && !validSurveyDeadline(fields.deadline))
    return "Enter a valid deadline.";
  return null;
}

export function validateCreateSurveyInput(value: unknown): value is CreateSurveyRequest {
  return (
    isRecord(value) &&
    Object.keys(value).every((key) => fields.includes(key)) &&
    createSurveyValidationMessage(value) === null
  );
}

export function normalizeCreateSurveyInput(input: CreateSurveyRequest): CreateSurveyRequest {
  const deadline = input.deadline?.trim() || null;
  return {
    title: input.title.trim(),
    survey_link: input.survey_link.trim(),
    description: input.description?.trim() || null,
    target_group: input.target_group?.trim() || null,
    desired_responses: input.desired_responses ?? null,
    // Date-only input uses midnight UTC consistently across browsers and time zones.
    deadline: deadline
      ? new Date(deadline.length === 10 ? `${deadline}T00:00:00.000Z` : deadline).toISOString()
      : null,
  };
}
