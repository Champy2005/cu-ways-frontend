"use server";

import { getCreatorJob } from "@/features/jobs/api";
import type { CreatorJobSummary } from "@/features/jobs/types";
import { ApiError } from "@/lib/api/errors";
import type { components } from "@/lib/api/generated/backend";
import { serverApiRequest } from "@/lib/api/server-client";
import { getSession } from "@/lib/auth/session";

export type SavedJobState =
  | { status: "success"; job: CreatorJobSummary; creatorId: number; notice?: string }
  | { status: "error"; message: string };

export type CreatePendingJobState =
  | { status: "success"; jobId: number; creatorId: number }
  | { status: "error" | "reconcile"; message: string };

function positiveId(value: unknown): value is number {
  return (
    typeof value === "number" && Number.isInteger(value) && value > 0 && value <= 2_147_483_647
  );
}

function parseId(value: unknown): number {
  const id = typeof value === "string" ? Number(value) : NaN;
  if (!positiveId(id) || String(id) !== value) {
    throw new ApiError(422, "invalid_id", "Select a valid job and survey.");
  }
  return id;
}

function parseSurveyIds(values: unknown): number[] {
  if (!Array.isArray(values) || values.length === 0) {
    throw new ApiError(422, "missing_surveys", "At least one survey is required.");
  }
  const ids = values.map(parseId);
  if (new Set(ids).size !== ids.length) {
    throw new ApiError(422, "duplicate_surveys", "Select each survey only once.");
  }
  return ids;
}

async function authenticatedCreatorId(): Promise<number> {
  const session = await getSession();
  if (!session) throw new ApiError(401, "unauthorized", "Sign in again to continue.");
  return session.userId;
}

async function readOwnedJob(jobId: number): Promise<CreatorJobSummary> {
  const job = await getCreatorJob(jobId);
  if (
    !job ||
    job.job_id !== jobId ||
    !["Pending", "Accepted", "In Progress", "Completed", "Cancelled"].includes(job.job_status) ||
    typeof job.created_at !== "string" ||
    !Number.isFinite(Date.parse(job.created_at)) ||
    !Array.isArray(job.surveys) ||
    job.surveys.length === 0 ||
    !job.surveys.every(
      (survey) =>
        survey &&
        positiveId(survey.survey_id) &&
        typeof survey.title === "string" &&
        survey.title.trim(),
    ) ||
    new Set(job.surveys.map((survey) => survey.survey_id)).size !== job.surveys.length
  )
    throw new Error("The saved job response was invalid.");
  return job;
}

function failureMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback;
  if (error.status === 401) return "Your session expired. Sign in again to continue.";
  if (error.status === 403) return "You do not own this job or one of the selected surveys.";
  if (error.status === 404) return "This job or survey is no longer available.";
  if (error.status === 422) return "Select at least one valid survey, without duplicates.";
  return fallback;
}

export async function loadSavedJob(jobIdValue: string): Promise<SavedJobState> {
  try {
    const creatorId = await authenticatedCreatorId();
    return { status: "success", job: await readOwnedJob(parseId(jobIdValue)), creatorId };
  } catch (error) {
    return {
      status: "error",
      message: failureMessage(error, "Your job could not be loaded. Please try again."),
    };
  }
}

export async function createPendingJob(
  selectedSurveyIds: string[],
): Promise<CreatePendingJobState> {
  try {
    const creatorId = await authenticatedCreatorId();
    const ids = parseSurveyIds(selectedSurveyIds);
    const body: components["schemas"]["CreateJobRequest"] = { survey_ids: ids };
    const job = await serverApiRequest<components["schemas"]["Job"]>("/api/v1/jobs", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (
      !job ||
      !positiveId(job.job_id) ||
      job.user_id !== creatorId ||
      job.job_status !== "Pending" ||
      job.accepted_offer_id !== null ||
      !Array.isArray(job.survey_ids) ||
      job.survey_ids.length !== ids.length ||
      new Set(job.survey_ids).size !== ids.length ||
      !ids.every((id) => job.survey_ids.includes(id))
    )
      throw new Error("Job creation could not be confirmed.");
    return { status: "success", jobId: job.job_id, creatorId };
  } catch (error) {
    if (error instanceof ApiError && [401, 403, 404, 422].includes(error.status)) {
      return {
        status: "error",
        message: failureMessage(
          error,
          "Your job could not be created. Your entered values remain on this form.",
        ),
      };
    }
    return {
      status: "reconcile",
      message: "Job creation could not be confirmed. Check your jobs before creating another job.",
    };
  }
}

async function recoverSurveyChange(
  error: unknown,
  jobId: number,
  creatorId: number,
  message: string,
  hasSuccessfulWrite = false,
): Promise<SavedJobState> {
  const notice = failureMessage(error, message);
  if (!jobId || !creatorId) return { status: "error", message: notice };
  if (
    !hasSuccessfulWrite &&
    error instanceof ApiError &&
    [401, 403, 404, 422].includes(error.status)
  ) {
    return { status: "error", message: notice };
  }
  try {
    return { status: "success", job: await readOwnedJob(jobId), creatorId, notice };
  } catch {
    return { status: "error", message: `${notice} Reload the job to check its saved surveys.` };
  }
}

async function changeSurveySelection(
  jobIdValue: string,
  surveyIds: string[],
  replace: boolean,
): Promise<SavedJobState> {
  let jobId = 0;
  let creatorId = 0;
  let hasSuccessfulWrite = false;
  try {
    creatorId = await authenticatedCreatorId();
    jobId = parseId(jobIdValue);
    const selectedIds = parseSurveyIds(surveyIds);
    const job = await readOwnedJob(jobId);
    const currentIds = job.surveys.map((survey) => survey.survey_id);
    // Add first so replacing a selection never temporarily removes its last survey.
    for (const id of selectedIds.filter((id) => !currentIds.includes(id))) {
      await serverApiRequest(`/api/v1/jobs/${jobId}/surveys/${id}`, { method: "POST" });
      hasSuccessfulWrite = true;
    }
    if (replace) {
      for (const id of currentIds.filter((id) => !selectedIds.includes(id))) {
        await serverApiRequest(`/api/v1/jobs/${jobId}/surveys/${id}`, { method: "DELETE" });
        hasSuccessfulWrite = true;
      }
    }
    return { status: "success", job: await readOwnedJob(jobId), creatorId };
  } catch (error) {
    return recoverSurveyChange(
      error,
      jobId,
      creatorId,
      "Some survey changes could not be saved. Review the saved links before trying again.",
      hasSuccessfulWrite,
    );
  }
}

export async function addJobSurveys(jobId: string, surveyIds: string[]): Promise<SavedJobState> {
  return changeSurveySelection(jobId, surveyIds, false);
}

export async function saveJobSurveySelection(
  jobId: string,
  surveyIds: string[],
): Promise<SavedJobState> {
  return changeSurveySelection(jobId, surveyIds, true);
}

export async function removeJobSurvey(
  jobIdValue: string,
  surveyIdValue: string,
): Promise<SavedJobState> {
  let jobId = 0;
  let creatorId = 0;
  try {
    creatorId = await authenticatedCreatorId();
    jobId = parseId(jobIdValue);
    const surveyId = parseId(surveyIdValue);
    const job = await readOwnedJob(jobId);
    if (job.surveys.some((survey) => survey.survey_id === surveyId)) {
      if (job.surveys.length === 1) {
        return {
          status: "success",
          job,
          creatorId,
          notice:
            "Keep at least one survey linked to this job. Add another survey before removing this one.",
        };
      }
      await serverApiRequest(`/api/v1/jobs/${jobId}/surveys/${surveyId}`, { method: "DELETE" });
    }
    return { status: "success", job: await readOwnedJob(jobId), creatorId };
  } catch (error) {
    return recoverSurveyChange(
      error,
      jobId,
      creatorId,
      "This survey could not be removed. Keep at least one survey linked to the job.",
    );
  }
}
