import { createJobFieldErrors, type CreateJobValues } from "@/features/jobs/schemas";
import { isJobSurveyOption } from "@/features/jobs/survey-options";
import type { JobSurveyOption } from "@/features/jobs/types";

export type JobDraft = {
  id: number;
  creatorId: number;
  values: CreateJobValues;
  selectedSurveyIds: string[];
  surveys?: JobSurveyOption[];
  status: "Pending";
};

const DRAFT_KEY_PREFIX = "cuways-job-form:";
const DRAFT_CHANGE_EVENT = "cuways-job-draft-change";

// Optional form metadata only. Backend job IDs and saved links remain authoritative.
export function saveJobDraft(
  values: CreateJobValues,
  selectedSurveyIds: string[],
  id: number,
  surveys: readonly JobSurveyOption[],
  creatorId: number,
): number {
  if (![id, creatorId].every((value) => Number.isSafeInteger(value) && value > 0))
    throw new Error("A saved job and creator ID are required.");
  if (selectedSurveyIds.length === 0) throw new Error("At least one survey is required.");
  const options = new Map(surveys.map((survey) => [survey.id, survey]));
  const draft: JobDraft = {
    id,
    creatorId,
    values: { ...values, title: values.title.trim(), budget: values.budget.trim() },
    selectedSurveyIds: [...selectedSurveyIds],
    surveys: selectedSurveyIds.flatMap((surveyId) => {
      const survey = options.get(surveyId);
      return survey ? [survey] : [];
    }),
    status: "Pending",
  };
  window.sessionStorage.setItem(`${DRAFT_KEY_PREFIX}${creatorId}:${id}`, JSON.stringify(draft));
  window.dispatchEvent(new Event(DRAFT_CHANGE_EVENT));
  return id;
}

function validSurveyDetails(surveys: unknown, selectedIds: string[]): boolean {
  if (surveys === undefined) return true;
  if (!Array.isArray(surveys) || !surveys.every(isJobSurveyOption)) return false;
  return (
    new Set(surveys.map((survey) => survey.id)).size === surveys.length &&
    surveys.every((survey) => selectedIds.includes(survey.id))
  );
}

export function readJobDraftSnapshot(id: string, creatorId: number): string | null {
  try {
    return window.sessionStorage.getItem(`${DRAFT_KEY_PREFIX}${creatorId}:${id}`);
  } catch {
    return null;
  }
}

export function subscribeJobDraft(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(DRAFT_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(DRAFT_CHANGE_EVENT, callback);
  };
}

export function parseJobDraft(
  raw: string | null,
  expectedId: string,
  creatorId: number,
): JobDraft | null {
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw) as Partial<JobDraft> | null;
    const values = draft?.values;
    if (
      !draft ||
      typeof draft.id !== "number" ||
      !Number.isSafeInteger(draft.id) ||
      draft.id < 1 ||
      String(draft.id) !== expectedId ||
      draft.creatorId !== creatorId ||
      draft.status !== "Pending" ||
      !values ||
      ![values.title, values.description, values.budget, values.deadline].every(
        (value) => typeof value === "string",
      ) ||
      !Array.isArray(draft.selectedSurveyIds) ||
      !draft.selectedSurveyIds.every((id) => typeof id === "string" && id.trim().length > 0) ||
      new Set(draft.selectedSurveyIds).size !== draft.selectedSurveyIds.length
    )
      return null;
    if (!validSurveyDetails(draft.surveys, draft.selectedSurveyIds)) return null;
    if (Object.keys(createJobFieldErrors(values, draft.selectedSurveyIds)).length > 0) return null;
    const date = new Date(`${values.deadline}T00:00:00Z`);
    if (date.toISOString().slice(0, 10) !== values.deadline) return null;
    return draft as JobDraft;
  } catch {
    return null;
  }
}
