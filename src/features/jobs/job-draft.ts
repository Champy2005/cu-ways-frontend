import { createJobFieldErrors, type CreateJobValues } from "@/features/jobs/schemas";

export type JobDraft = {
  id: number;
  values: CreateJobValues;
  selectedSurveyIds: string[];
  status: "Pending";
};

const DRAFT_KEY_PREFIX = "cuways-job-draft:";
const DRAFT_SEQUENCE_KEY = "cuways-job-draft-sequence";
const DRAFT_CHANGE_EVENT = "cuways-job-draft-change";

function nextJobDraftId(): number {
  const sequence = Number(window.sessionStorage.getItem(DRAFT_SEQUENCE_KEY));
  let id = Number.isSafeInteger(sequence) && sequence >= 0 ? sequence + 1 : 1;
  while (
    Number.isSafeInteger(id) &&
    window.sessionStorage.getItem(`${DRAFT_KEY_PREFIX}${id}`) !== null
  )
    id += 1;
  if (!Number.isSafeInteger(id)) throw new Error("Job preview ID limit reached.");
  window.sessionStorage.setItem(DRAFT_SEQUENCE_KEY, String(id));
  return id;
}

// Tab-local previews only; these IDs are not persisted backend job IDs.
export function saveJobDraft(
  values: CreateJobValues,
  selectedSurveyIds: string[],
  existingId?: number,
): number {
  if (selectedSurveyIds.length === 0) throw new Error("At least one survey is required.");
  const id = existingId ?? nextJobDraftId();
  const draft: JobDraft = {
    id,
    values: { ...values, title: values.title.trim(), budget: values.budget.trim() },
    selectedSurveyIds: [...selectedSurveyIds],
    status: "Pending",
  };
  window.sessionStorage.setItem(`${DRAFT_KEY_PREFIX}${id}`, JSON.stringify(draft));
  window.dispatchEvent(new Event(DRAFT_CHANGE_EVENT));
  return id;
}

export function readJobDraftSnapshot(id: string): string | null {
  try {
    return window.sessionStorage.getItem(`${DRAFT_KEY_PREFIX}${id}`);
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

export function parseJobDraft(raw: string | null, expectedId: string): JobDraft | null {
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
    if (Object.keys(createJobFieldErrors(values, draft.selectedSurveyIds)).length > 0) return null;
    const date = new Date(`${values.deadline}T00:00:00Z`);
    if (date.toISOString().slice(0, 10) !== values.deadline) return null;
    return draft as JobDraft;
  } catch {
    return null;
  }
}
