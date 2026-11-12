import { getMarketerOffers } from "@/features/job-invitations/live/api";
import type { MarketerOfferItem } from "@/features/job-invitations/live/types";
import { parseProjectBriefUrl } from "@/features/jobs/project-brief";
import { getPayment } from "@/features/transactions/queries";
import { ApiError } from "@/lib/api/errors";
import { jobStatuses, type HiredJob, type JobFailure } from "./types";
import { getCompletionEvidence } from "./completion-api";

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
export async function getHiredJobs(userId: number, jobId?: number): Promise<HiredJob[]> {
  const snapshot = await getMarketerOffers(jobId);
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

export async function getHiredJob(id: string, userId: number): Promise<HiredJob> {
  // This endpoint authorizes the hired Marketer before any private context is returned.
  const saved = await getPayment(id);
  if (saved.job_id !== Number(id) || saved.marketer.user_id !== userId)
    throw new ApiError(404, "job_not_found", "Job unavailable.");
  // Fetch only this job's offer history. Unrelated offer failures cannot break this read.
  // Proofs can load alongside that history, after settlement authorization succeeds.
  const [jobs, completion] = await Promise.all([
    getHiredJobs(userId, saved.job_id),
    saved.job_status === "In Progress" || saved.job_status === "Completed"
      ? getCompletionEvidence(saved)
      : undefined,
  ]);
  const job = jobs.find((item) => item.id === Number(id));
  if (!job || !jobStatuses.some((status) => status === saved.job_status))
    throw new ApiError(422, "invalid_job", "Job details need refreshing.");
  const detail: HiredJob = {
    ...job,
    status: saved.job_status as HiredJob["status"],
    price: saved.accepted_price,
  };
  if (completion) detail.completion = completion;
  return detail;
}

export function jobFailure(error: unknown): JobFailure {
  if (!(error instanceof ApiError)) return "error";
  if (error.status === 401) return "expired";
  if (["marketer_profile_required", "marketer_required"].includes(error.code)) return "forbidden";
  if (error.status === 403 || error.status === 404) return "unavailable";
  if (error.status === 422 || error.status === 409) return "invalid";
  return "error";
}
