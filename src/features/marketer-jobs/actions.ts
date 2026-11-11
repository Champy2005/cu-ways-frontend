"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { serverApiRequest } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import type { components } from "@/lib/api/generated/backend";
import { getHiredJob, getHiredJobs, jobFailure } from "./api";
import type { HiredJob, JobsResult, StartResult } from "./types";

export async function loadHiredJobs(): Promise<JobsResult<HiredJob[]>> {
  const session = await getSession();
  if (!session) return { status: "expired" };
  try {
    return { status: "success", data: await getHiredJobs(session.userId) };
  } catch (error) {
    return { status: jobFailure(error) };
  }
}

export async function loadHiredJob(id: string): Promise<JobsResult<HiredJob>> {
  const session = await getSession();
  if (!session) return { status: "expired" };
  try {
    return { status: "success", data: await getHiredJob(id, session.userId) };
  } catch (error) {
    return { status: jobFailure(error) };
  }
}

export async function startHiredJob(id: string): Promise<StartResult> {
  const session = await getSession();
  if (!session) return { status: "expired" };
  let job: HiredJob;
  try {
    job = await getHiredJob(id, session.userId);
  } catch (error) {
    return { status: jobFailure(error) };
  }
  if (job.status === "In Progress") return { status: "already-started", job };
  if (job.status !== "Accepted") return { status: "invalid" };
  try {
    const saved = await serverApiRequest<components["schemas"]["StartJobResponse"]["data"]>(
      `/api/v1/jobs/${id}/start`,
      { method: "POST" },
    );
    if (saved.job_id !== job.id || saved.job_status !== "In Progress") return { status: "recheck" };
    revalidatePath("/marketer/jobs", "layout");
    return { status: "started", job: { ...job, status: "In Progress" } };
  } catch (error) {
    if (error instanceof ApiError && [401, 403, 404, 422].includes(error.status))
      return { status: jobFailure(error) };
    // A failed transport or conflict never proves that the write rolled back.
    return { status: "recheck" };
  }
}
