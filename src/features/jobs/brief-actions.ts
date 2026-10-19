"use server";

import {
  parseProjectBriefUrl,
  validateJobBrief,
  validateJobBriefHistory,
  type JobBrief,
} from "@/features/jobs/project-brief";
import { ApiError } from "@/lib/api/errors";
import type { components } from "@/lib/api/generated/backend";
import { serverApiGet, serverApiRequest } from "@/lib/api/server-client";
import { getSession } from "@/lib/auth/session";

export type JobBriefHistoryState =
  | { status: "success"; history: JobBrief[]; creatorId: number }
  | { status: "error"; message: string };

export type SaveJobBriefState =
  | { status: "success"; brief: JobBrief; creatorId: number }
  | { status: "error" | "reconcile"; message: string };

function parseJobId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1 || id > 2_147_483_647 || String(id) !== value) {
    throw new ApiError(422, "invalid_job", "Select a valid job.");
  }
  return id;
}

async function authenticatedCreatorId(): Promise<number> {
  const session = await getSession();
  if (!session) throw new ApiError(401, "unauthorized", "Sign in again to continue.");
  return session.userId;
}

function failureMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback;
  if (error.status === 401) return "Your session expired. Sign in again to continue.";
  if (error.status === 403) return "You do not have permission to manage this job's briefs.";
  if (error.status === 404) return "This job is no longer available.";
  if (error.status === 422) return "Select a valid job and enter an absolute HTTP or HTTPS URL.";
  return fallback;
}

async function readBriefs(jobId: number): Promise<JobBrief[]> {
  return validateJobBriefHistory(await serverApiGet<unknown>(`/api/v1/jobs/${jobId}/briefs`));
}

export async function loadJobBriefs(jobIdValue: string): Promise<JobBriefHistoryState> {
  try {
    const creatorId = await authenticatedCreatorId();
    return { status: "success", history: await readBriefs(parseJobId(jobIdValue)), creatorId };
  } catch (error) {
    return {
      status: "error",
      message: failureMessage(error, "Your project brief could not be loaded. Please try again."),
    };
  }
}

export async function saveJobBrief(
  jobIdValue: string,
  urlValue: string,
): Promise<SaveJobBriefState> {
  let posting = false;
  try {
    const creatorId = await authenticatedCreatorId();
    const jobId = parseJobId(jobIdValue);
    const url = typeof urlValue === "string" ? parseProjectBriefUrl(urlValue) : null;
    if (!url) throw new ApiError(422, "invalid_url", "Enter a valid brief URL.");
    const body: components["schemas"]["CreateBriefRequest"] = { url };
    posting = true;
    const brief = validateJobBrief(
      await serverApiRequest<unknown>(`/api/v1/jobs/${jobId}/briefs`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    );
    if (parseProjectBriefUrl(brief.url) !== url)
      throw new Error("The saved brief did not match the request.");
    return { status: "success", brief, creatorId };
  } catch (error) {
    if (
      !posting ||
      (error instanceof ApiError &&
        error.status >= 400 &&
        error.status < 500 &&
        error.status !== 408)
    ) {
      return {
        status: "error",
        message: failureMessage(
          error,
          "Your brief could not be saved. Your entered values remain on this form.",
        ),
      };
    }
    return {
      status: "reconcile",
      message: "The save could not be confirmed. Reload brief history before saving again.",
    };
  }
}
