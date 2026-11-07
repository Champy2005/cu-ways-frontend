import { ApiError } from "@/lib/api/errors";
import { isRecord } from "@/lib/api/envelope";
import { serverApiGet } from "@/lib/api/server-client";
import { isActivePayment, type ActivePayment } from "@/features/jobs/payment";
import { isSavedReview, type SavedReview } from "@/features/jobs/review";
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

/**
 * Reads a job's single record (its payment or its review) from a
 * `{ [key]: record | null }` response. Throws when the record is malformed so
 * it is never shown as real.
 */
async function readCurrentJobRecord<T>(
  path: string,
  key: string,
  isValid: (value: unknown) => value is T,
  invalidMessage: string,
): Promise<T | null> {
  const data = await serverApiGet<unknown>(path);
  const record = isRecord(data) ? data[key] : undefined;
  if (record === null) return null;
  if (isValid(record)) return record;
  throw new Error(invalidMessage);
}

/** Loads the owned job, its accepted offer and one of its records, all at once. */
async function loadJobWithRecord<T>(
  jobId: number,
  readRecord: (jobId: number) => Promise<T | null>,
) {
  const [job, accepted, record] = await Promise.all([
    getCreatorJob(jobId),
    getJobOffers(jobId, "Accepted"),
    readRecord(jobId),
  ]);
  return {
    job,
    acceptedOffer: accepted.find((offer) => offer.offer_status === "Accepted") ?? null,
    record,
  };
}

export type JobPaymentData = {
  job: CreatorJobSummary;
  acceptedOffer: JobOfferComparison | null;
  /** The job's Pending or Paid payment from the backend, or null when none exists. */
  currentPayment: ActivePayment | null;
};

/** Reads the owned job's active payment; throws when the response is not a valid record. */
export function getCurrentJobPayment(jobId: number): Promise<ActivePayment | null> {
  return readCurrentJobRecord(
    `/api/v1/jobs/${jobId}/payments/current`,
    "payment",
    (value): value is ActivePayment => isActivePayment(value, jobId),
    "The payment record could not be read. Refresh and try again.",
  );
}

/**
 * Loads the owned job, its accepted offer (the price a payment must match),
 * and any payment already recorded, so a reload shows the saved record.
 */
export async function loadJobPaymentData(jobId: number): Promise<JobPaymentData> {
  const { record, ...data } = await loadJobWithRecord(jobId, getCurrentJobPayment);
  return { ...data, currentPayment: record };
}

export type JobReviewData = {
  job: CreatorJobSummary;
  /** The hired Marketer's offer; the reviewed Marketer is derived from it, never from user input. */
  acceptedOffer: JobOfferComparison | null;
  /** The job's saved review, or null when it has not been reviewed. */
  currentReview: SavedReview | null;
};

/** Reads the owned job's review; throws when the response is not a valid record. */
export function getCurrentJobReview(jobId: number): Promise<SavedReview | null> {
  return readCurrentJobRecord(
    `/api/v1/jobs/${jobId}/reviews/current`,
    "review",
    (value): value is SavedReview => isSavedReview(value, jobId),
    "The review could not be read. Refresh and try again.",
  );
}

/**
 * Loads the owned job, the accepted offer that names the reviewed Marketer,
 * and any saved review, so a reload shows the review instead of the form.
 */
export async function loadJobReviewData(jobId: number): Promise<JobReviewData> {
  const { record, ...data } = await loadJobWithRecord(jobId, getCurrentJobReview);
  return { ...data, currentReview: record };
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
