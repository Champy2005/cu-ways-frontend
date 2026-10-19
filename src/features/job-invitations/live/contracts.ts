import { isRecord } from "@/lib/api/envelope";
import { ApiError } from "@/lib/api/errors";
import { isCalendarDate, isOfferPrice } from "../validation";
import type { InvitationEntry, ReceivedRequest, SavedOffer, SavedRequest } from "./types";

export function invalidResponse(): never {
  throw new ApiError(
    502,
    "invalid_backend_response",
    "Invitation data could not be read. Please try again.",
  );
}
const id = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value) && value > 0 && value <= 2_147_483_647;
const text = (value: unknown) => value === null || typeof value === "string";
const timestamp = (value: unknown) =>
  typeof value === "string" && Number.isFinite(Date.parse(value));
const optionalTime = (value: unknown) => value === null || timestamp(value);
const count = (value: unknown) =>
  value === null || (typeof value === "number" && Number.isInteger(value) && value >= 0);

export function readRequest(value: unknown): SavedRequest {
  if (!isRecord(value)) return invalidResponse();
  if (
    ![value.job_request_id, value.job_id, value.marketer_id].every(id) ||
    typeof value.request_status !== "string" ||
    !["Pending", "Accepted", "Declined", "Closed"].includes(value.request_status) ||
    !timestamp(value.created_at) ||
    !optionalTime(value.responded_at) ||
    !text(value.decline_reason ?? null) ||
    !text(value.decline_note ?? null)
  )
    return invalidResponse();
  return {
    job_request_id: value.job_request_id as number,
    job_id: value.job_id as number,
    marketer_id: value.marketer_id as number,
    request_status: value.request_status as SavedRequest["request_status"],
    created_at: value.created_at as string,
    responded_at: value.responded_at as string | null,
    decline_reason: (value.decline_reason ?? null) as SavedRequest["decline_reason"],
    decline_note: (value.decline_note ?? null) as string | null,
  };
}

function readSurvey(value: unknown): ReceivedRequest["job"]["surveys"][number] {
  if (
    !isRecord(value) ||
    !id(value.survey_id) ||
    typeof value.title !== "string" ||
    typeof value.survey_link !== "string" ||
    !text(value.description) ||
    !text(value.target_group) ||
    !count(value.desired_responses) ||
    !optionalTime(value.deadline)
  )
    return invalidResponse();
  return {
    survey_id: value.survey_id as number,
    title: value.title,
    survey_link: value.survey_link,
    description: value.description as string | null,
    target_group: value.target_group as string | null,
    desired_responses: value.desired_responses as number | null,
    deadline: value.deadline as string | null,
  };
}

function readBrief(value: unknown): ReceivedRequest["job"]["brief"] {
  if (value === null) return null;
  if (
    !isRecord(value) ||
    !id(value.attachment_id) ||
    value.attachment_type !== "Brief" ||
    typeof value.url !== "string" ||
    !timestamp(value.upload_at)
  )
    return invalidResponse();
  return {
    attachment_id: value.attachment_id as number,
    attachment_type: "Brief",
    url: value.url,
    upload_at: value.upload_at as string,
  };
}

export function readReceivedRequest(value: unknown): ReceivedRequest {
  const request = readRequest(value);
  if (!isRecord(value) || !isRecord(value.job)) return invalidResponse();
  const job = value.job;
  if (
    job.job_id !== request.job_id ||
    !isRecord(job.creator) ||
    !id(job.creator.user_id) ||
    typeof job.creator.name !== "string" ||
    !optionalTime(job.deadline) ||
    !count(job.target_responses) ||
    typeof job.job_status !== "string" ||
    !["Pending", "Accepted", "In Progress", "Completed", "Cancelled"].includes(job.job_status) ||
    !Array.isArray(job.surveys)
  )
    return invalidResponse();
  return {
    ...request,
    job: {
      job_id: request.job_id,
      job_status: job.job_status as ReceivedRequest["job"]["job_status"],
      creator: { user_id: job.creator.user_id as number, name: job.creator.name },
      deadline: job.deadline as string | null,
      target_responses: job.target_responses as number | null,
      surveys: job.surveys.map(readSurvey),
      brief: readBrief(job.brief),
    },
  };
}

export function readOffer(value: unknown): SavedOffer {
  if (
    !isRecord(value) ||
    ![value.offer_id, value.job_id, value.marketer_id].every(id) ||
    !(value.job_request_id === null || id(value.job_request_id)) ||
    !isOfferPrice(value.offered_price) ||
    !(value.delivery_date === null || isCalendarDate(value.delivery_date)) ||
    !text(value.message) ||
    typeof value.offer_status !== "string" ||
    !["Pending", "Accepted", "Rejected", "Withdrawn"].includes(value.offer_status) ||
    !timestamp(value.created_at)
  )
    return invalidResponse();
  return {
    offer_id: value.offer_id as number,
    job_id: value.job_id as number,
    marketer_id: value.marketer_id as number,
    job_request_id: value.job_request_id as number | null,
    offered_price: value.offered_price,
    delivery_date: value.delivery_date as string | null,
    message: value.message as string | null,
    offer_status: value.offer_status as SavedOffer["offer_status"],
    created_at: value.created_at as string,
  };
}

export function readRequests(value: unknown): ReceivedRequest[] {
  if (!Array.isArray(value)) return invalidResponse();
  return value.map(readReceivedRequest);
}
export function readOffers(value: unknown, request: SavedRequest): SavedOffer[] {
  if (!Array.isArray(value)) return invalidResponse();
  return value.map((item) => {
    const offer = readOffer(item);
    if (
      offer.job_request_id !== request.job_request_id ||
      offer.job_id !== request.job_id ||
      offer.marketer_id !== request.marketer_id
    )
      return invalidResponse();
    return offer;
  });
}
export function readEntries(value: unknown): InvitationEntry[] {
  if (!Array.isArray(value)) return invalidResponse();
  return value.map((item) => {
    if (!isRecord(item) || typeof item.offersUnavailable !== "boolean") return invalidResponse();
    const request = readReceivedRequest(item.request);
    const offers = readOffers(item.offer === null ? [] : [item.offer], request);
    return { request, offer: offers[0] ?? null, offersUnavailable: item.offersUnavailable };
  });
}
