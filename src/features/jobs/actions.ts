"use server";

import type { components } from "@/lib/api/generated/backend";
import { ApiError } from "@/lib/api/errors";
import { serverApiRequest } from "@/lib/api/server-client";
import { getJobSentInvitations } from "@/features/jobs/api";
import { isActiveJobInvitation } from "@/features/jobs/types";
import { getSession } from "@/lib/auth/session";
import { listMarketers } from "@/features/marketer-discovery/api";
import { SEARCH_PAGE_SIZE } from "@/features/marketer-discovery/constants";
import { EMPTY_MARKETER_QUERY } from "@/features/marketer-discovery/schemas";
import {
  validateSentJobInvitations,
  type JobInviteMarketer,
  type SentJobInvitation,
} from "@/features/jobs/types";

export type JobRequestActionState =
  | { status: "idle" }
  | { status: "success"; requests: components["schemas"]["JobRequest"][] }
  | {
      status: "duplicate";
      message: string;
      refreshStatus: "success";
      sentInvitations: SentJobInvitation[];
      conflictingMarketerIds: number[];
    }
  | { status: "duplicate"; message: string; refreshStatus: "error" }
  | { status: "reconcile"; message: string }
  | { status: "job_not_pending"; message: string }
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

export type JobSentInvitationsActionState =
  { status: "success"; items: SentJobInvitation[] } | { status: "error"; message: string };

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

function isJobRequestRecord(
  value: unknown,
  expectedJobId: number,
): value is components["schemas"]["JobRequest"] {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Partial<components["schemas"]["JobRequest"]>;
  return (
    parsePositiveId(record.job_request_id) !== null &&
    record.job_id === expectedJobId &&
    parsePositiveId(record.marketer_id) !== null &&
    record.request_status === "Pending" &&
    typeof record.created_at === "string" &&
    record.responded_at === null
  );
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

export async function loadJobSentInvitations(
  jobIdValue: unknown,
): Promise<JobSentInvitationsActionState> {
  const jobId = parsePositiveId(jobIdValue);
  if (jobId === null) {
    return { status: "error", message: "This job is not available. Return to job selection." };
  }

  try {
    const session = await getSession();
    if (!session) {
      return { status: "error", message: "Your session expired. Sign in again to continue." };
    }
    const invitations = await getJobSentInvitations(jobId);
    return {
      status: "success",
      items: validateSentJobInvitations(invitations, jobId),
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return { status: "error", message: "Your session expired. Sign in again to continue." };
    }
    if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
      return { status: "error", message: "You no longer have access to this job." };
    }
    return {
      status: "error",
      message: "Current invitations could not be refreshed. Check your connection and try again.",
    };
  }
}

function errorState(error: unknown): JobRequestActionState {
  if (error instanceof ApiError) {
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

async function refreshAfterDuplicate(
  jobId: number,
  selectedIds: number[],
): Promise<JobRequestActionState> {
  const invitations = await loadJobSentInvitations(jobId);
  if (invitations.status === "error") {
    return {
      status: "duplicate",
      refreshStatus: "error",
      message:
        "The server found an active invitation, but its current status could not be refreshed. Refresh invitations before sending again.",
    };
  }

  const selectedIdSet = new Set(selectedIds);
  const conflictingMarketerIds = [
    ...new Set(
      invitations.items
        .filter((invitation) => isActiveJobInvitation(invitation))
        .map((invitation) => invitation.marketer_id)
        .filter((marketerId) => selectedIdSet.has(marketerId)),
    ),
  ];

  return {
    status: "duplicate",
    refreshStatus: "success",
    sentInvitations: invitations.items,
    conflictingMarketerIds,
    message:
      "One or more selected marketers already have an active invitation. Review the current statuses before sending again.",
  };
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

    const selectedIds = new Set(marketerIds);
    const responseIsComplete =
      Array.isArray(requests) &&
      requests.length === marketerIds.length &&
      requests.every(
        (request) => isJobRequestRecord(request, jobId) && selectedIds.has(request.marketer_id),
      ) &&
      new Set(requests.map((request) => request.marketer_id)).size === requests.length &&
      new Set(requests.map((request) => request.job_request_id)).size === requests.length;
    if (!responseIsComplete) {
      return {
        status: "reconcile",
        message:
          "The server accepted the request, but its response was incomplete. Refresh invitations before sending again.",
      };
    }

    return { status: "success", requests };
  } catch (error) {
    if (error instanceof ApiError && error.status === 409 && error.code === "job_not_pending") {
      return {
        status: "job_not_pending",
        message: "This job is no longer pending, so no further invitations can be sent.",
      };
    }
    if (error instanceof ApiError && error.status === 409 && error.code === "job_conflict") {
      return refreshAfterDuplicate(jobId, marketerIds);
    }
    return errorState(error);
  }
}
