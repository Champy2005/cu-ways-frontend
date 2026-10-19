import { ApiError } from "@/lib/api/errors";
import { serverApiGet } from "@/lib/api/server-client";
import { listMarketers } from "@/features/marketer-discovery/api";
import { SEARCH_PAGE_SIZE } from "@/features/marketer-discovery/constants";
import { EMPTY_MARKETER_QUERY } from "@/features/marketer-discovery/schemas";
import { validateJobOffers, validateSentJobInvitations } from "@/features/jobs/types";
import { toJobSurveyOptions } from "@/features/jobs/survey-options";
import type {
  CreatorJobSummary,
  JobSurveyOption,
  JobInviteMarketer,
  JobOfferComparison,
  OfferStatus,
  SentJobInvitation,
} from "@/features/jobs/types";

export async function getCreatorSurveys(): Promise<JobSurveyOption[]> {
  return toJobSurveyOptions(await serverApiGet<unknown>("/api/v1/me/surveys"));
}

export type JobOffersInitialData = {
  job: CreatorJobSummary;
  offers: { status: "success"; items: JobOfferComparison[] } | { status: "error"; message: string };
};

export type JobInviteInitialData = {
  job: CreatorJobSummary;
  invitations:
    { status: "success"; items: SentJobInvitation[] } | { status: "error"; message: string };
  marketers:
    | {
        status: "success";
        items: JobInviteMarketer[];
        total: number;
        pageSize: number;
      }
    | { status: "error"; message: string };
};

export async function getCreatorJobs(): Promise<CreatorJobSummary[]> {
  return serverApiGet<CreatorJobSummary[]>("/api/v1/me/jobs");
}

export async function getCreatorJob(jobId: number): Promise<CreatorJobSummary> {
  return serverApiGet<CreatorJobSummary>(`/api/v1/jobs/${jobId}`);
}

export async function getJobSentInvitations(jobId: number): Promise<SentJobInvitation[]> {
  const response = await serverApiGet<unknown>(`/api/v1/jobs/${jobId}/requests`);
  return validateSentJobInvitations(response, jobId);
}

function readFailureMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.status === 401) {
    return "Your session expired. Sign in again to continue.";
  }
  if (error instanceof ApiError && error.status === 403) {
    return "You do not have access to this Creator workspace.";
  }
  return fallback;
}

export async function loadCreatorJobs(): Promise<
  { status: "success"; items: CreatorJobSummary[] } | { status: "error"; message: string }
> {
  try {
    return { status: "success", items: await getCreatorJobs() };
  } catch (error) {
    return {
      status: "error",
      message: readFailureMessage(error, "Your jobs could not be loaded. Refresh and try again."),
    };
  }
}

/** Loads the owned job first, then starts the invitations and marketer reads. */
export async function loadJobInviteInitialData(jobId: number): Promise<JobInviteInitialData> {
  const job = await getCreatorJob(jobId);
  const [invitations, marketers] = await Promise.allSettled([
    getJobSentInvitations(jobId),
    listMarketers(EMPTY_MARKETER_QUERY),
  ]);

  return {
    job,
    invitations:
      invitations.status === "fulfilled"
        ? { status: "success", items: invitations.value }
        : {
            status: "error",
            message:
              "Current invitations could not be loaded. Refresh before sending any new ones.",
          },
    marketers:
      marketers.status === "fulfilled"
        ? {
            status: "success",
            items: marketers.value.items.map((marketer) => ({
              marketer_id: marketer.marketer_id,
              display_name: marketer.display_name,
              headline: marketer.headline,
              average_rating: marketer.average_rating,
              rating_count: marketer.rating_count,
            })),
            total: marketers.value.total,
            pageSize: SEARCH_PAGE_SIZE,
          }
        : {
            status: "error",
            message: "Marketers could not be loaded. Check your connection and try again.",
          },
  };
}

export async function getJobOffers(
  jobId: number,
  status?: OfferStatus,
): Promise<JobOfferComparison[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const response = await serverApiGet<unknown>(`/api/v1/jobs/${jobId}/offers${query}`);
  return validateJobOffers(response, jobId);
}

export async function loadJobOffersInitialData(jobId: number): Promise<JobOffersInitialData> {
  const job = await getCreatorJob(jobId);
  try {
    const offers = await getJobOffers(jobId);
    return {
      job,
      offers: { status: "success", items: offers },
    };
  } catch (error) {
    return {
      job,
      offers: {
        status: "error",
        message: readFailureMessage(error, "Offers could not be loaded. Refresh and try again."),
      },
    };
  }
}
