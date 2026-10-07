"use server";

import type { components } from "@/lib/api/generated/backend";
import { ApiError } from "@/lib/api/errors";
import { serverApiRequest } from "@/lib/api/server-client";
import { getSession } from "@/lib/auth/session";
import { listMarketers } from "@/features/marketer-discovery/api";
import { SEARCH_PAGE_SIZE } from "@/features/marketer-discovery/constants";
import { EMPTY_MARKETER_QUERY } from "@/features/marketer-discovery/schemas";
import type { JobInviteMarketer } from "@/features/jobs/types";

export type JobRequestActionState =
  | { status: "idle" }
  | { status: "success"; createdCount: number }
  | { status: "duplicate"; message: string }
  | { status: "error"; message: string };

export type JobInviteMarketersPageState =
  | {
      status: "success";
      items: JobInviteMarketer[];
      page: number;
      pageSize: number;
      total: number;
      keyword: string;
    }
  | { status: "error"; message: string };

function parsePositiveId(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0 &&
    value <= 2_147_483_647
    ? value
    : null;
}

function parseMarketerIds(values: unknown): number[] | null {
  if (!Array.isArray(values) || values.length === 0) return null;
  const parsedIds: number[] = [];
  for (const value of values) {
    const id = parsePositiveId(value);
    if (id === null) return null;
    parsedIds.push(id);
  }
  return new Set(parsedIds).size === parsedIds.length ? parsedIds : null;
}

export async function loadJobInviteMarketersPage(
  pageValue: unknown,
  keywordValue: unknown = "",
): Promise<JobInviteMarketersPageState> {
  const page = parsePositiveId(pageValue);
  if (page === null || typeof keywordValue !== "string" || keywordValue.length > 100) {
    return {
      status: "error",
      message: "That marketer search is not available. Refresh and try again.",
    };
  }
  const keyword = keywordValue.trim();

  const session = await getSession();
  if (!session) {
    return { status: "error", message: "Your session expired. Sign in again to continue." };
  }

  try {
    const result = await listMarketers({ ...EMPTY_MARKETER_QUERY, q: keyword }, page);
    return {
      status: "success",
      items: result.items.map((marketer) => ({
        marketer_id: marketer.marketer_id,
        display_name: marketer.display_name,
        headline: marketer.headline,
        average_rating: marketer.average_rating,
        rating_count: marketer.rating_count,
      })),
      page,
      pageSize: SEARCH_PAGE_SIZE,
      total: result.total,
      keyword,
    };
  } catch {
    return {
      status: "error",
      message: "Marketers could not be loaded. Check your connection and try again.",
    };
  }
}

function errorState(error: unknown): JobRequestActionState {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return {
        status: "duplicate",
        message:
          "One or more selected marketers already have an active request for this job. Remove them from your selection and try again.",
      };
    }
    if (error.status === 401) {
      return { status: "error", message: "Your session expired. Sign in again to continue." };
    }
    if (error.status === 403) {
      return {
        status: "error",
        message: "You do not have access to this job. Check that you are signed in as its Creator.",
      };
    }
    if (error.status === 404) {
      return {
        status: "error",
        message: "This job could not be found. Check the job ID and try again.",
      };
    }
    if (error.status === 422) {
      return {
        status: "error",
        message: "Some selected marketers are unavailable. Refresh the list and try again.",
      };
    }
    return { status: "error", message: error.message };
  }

  return { status: "error", message: "The request could not be completed. Please try again." };
}

export async function sendJobRequests(
  jobIdValue: unknown,
  marketerIdValues: unknown,
): Promise<JobRequestActionState> {
  const session = await getSession();
  if (!session) {
    return { status: "error", message: "Your session expired. Sign in again to continue." };
  }

  const jobId = parsePositiveId(jobIdValue);
  const marketerIds = parseMarketerIds(marketerIdValues);
  if (jobId === null || marketerIds === null) {
    return { status: "error", message: "Choose at least one valid marketer before sending." };
  }

  try {
    const requests = await serverApiRequest<components["schemas"]["JobRequest"][]>(
      `/api/v1/jobs/${jobId}/requests`,
      {
        method: "POST",
        body: JSON.stringify({ marketer_ids: marketerIds }),
      },
    );

    if (!Array.isArray(requests) || requests.length !== marketerIds.length) {
      return {
        status: "error",
        message: "The server response was incomplete. Refresh the page before trying again.",
      };
    }

    return { status: "success", createdCount: requests.length };
  } catch (error) {
    return errorState(error);
  }
}
