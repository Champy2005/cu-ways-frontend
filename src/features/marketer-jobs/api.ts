import { getMarketerOffers } from "@/features/job-invitations/live/api";
import type { MarketerOfferItem } from "@/features/job-invitations/live/types";
import { parseProjectBriefUrl } from "@/features/jobs/project-brief";
import { serverApiGet } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import type { components } from "@/lib/api/generated/backend";
import { jobStatuses, type HiredJob, type JobFailure } from "./types";

type Settlement = components["schemas"]["JobSettlement"];

function hiredJob({ request, offer }: MarketerOfferItem): HiredJob {
  const job = request.job;
  if (!jobStatuses.some((status) => status === job.job_status))
    throw new ApiError(422, "invalid_job", "Job details need refreshing.");
  return {
    id: request.job_id,
    status: job.job_status as HiredJob["status"],
    surveys: job.surveys.map((survey) => ({ id: survey.survey_id, title: survey.title })),
    creator: job.creator.name,
    price: offer.offered_price,
    deliveryDate: offer.delivery_date,
    deadline: job.deadline,
    targetResponses: job.target_responses,
    briefUrl: job.brief ? parseProjectBriefUrl(job.brief.url) : null,
  };
}

/** The Creator's /me/jobs endpoint cannot list hired Marketer jobs. Use the
 * authenticated invitation/offer history and only include this user's accepted offers. */
export async function getHiredJobs(userId: number): Promise<HiredJob[]> {
  const snapshot = await getMarketerOffers();
  if (snapshot.offersUnavailable) throw new Error("The hired job history is incomplete.");
  const jobs = snapshot.offers
    .filter(
      ({ request, offer }) =>
        request.marketer_id === userId &&
        offer.marketer_id === userId &&
        offer.offer_status === "Accepted" &&
        request.job.job_status !== "Pending",
    )
    .map(hiredJob);
  return [...new Map(jobs.map((job) => [job.id, job])).values()].sort((a, b) => b.id - a.id);
}

export function validJobId(id: string) {
  return /^[1-9]\d{0,9}$/.test(id) && Number(id) <= 2_147_483_647;
}

export async function getHiredJob(id: string, userId: number): Promise<HiredJob> {
  if (!validJobId(id)) throw new ApiError(404, "job_not_found", "Job unavailable.");
  // This endpoint authorizes the hired Marketer before any private context is returned.
  const saved = await serverApiGet<Settlement>(`/api/v1/jobs/${id}/payments`);
  if (saved.job_id !== Number(id) || saved.marketer.user_id !== userId)
    throw new ApiError(404, "job_not_found", "Job unavailable.");
  const jobs = await getHiredJobs(userId);
  const job = jobs.find((item) => item.id === Number(id));
  if (!job || !jobStatuses.some((status) => status === saved.job_status))
    throw new ApiError(422, "invalid_job", "Job details need refreshing.");
  return { ...job, status: saved.job_status as HiredJob["status"], price: saved.accepted_price };
}

export function jobFailure(error: unknown): JobFailure {
  if (!(error instanceof ApiError)) return "error";
  if (error.status === 401) return "expired";
  if (["marketer_profile_required", "marketer_required"].includes(error.code)) return "forbidden";
  if (error.status === 403 || error.status === 404) return "unavailable";
  if (error.status === 422 || error.status === 409) return "invalid";
  return "error";
}
