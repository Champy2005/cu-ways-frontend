import type { InvitationEntry, ReceivedRequest, SavedOffer } from "./types";

export function receivedRequest(
  status: ReceivedRequest["request_status"] = "Accepted",
): ReceivedRequest {
  return {
    job_request_id: 7,
    job_id: 3,
    marketer_id: 2,
    request_status: status,
    created_at: "2026-10-15T00:00:00Z",
    responded_at: status === "Pending" ? null : "2026-10-15T01:00:00Z",
    decline_reason: null,
    decline_note: null,
    job: {
      job_id: 3,
      job_status: "Pending",
      creator: { user_id: 1, name: "Test creator" },
      deadline: null,
      target_responses: null,
      brief: null,
      surveys: [
        {
          survey_id: 4,
          title: "Campus survey",
          survey_link: "https://example.test/survey",
          description: null,
          target_group: null,
          desired_responses: null,
          deadline: null,
        },
      ],
    },
  };
}
export function savedOffer(status: SavedOffer["offer_status"] = "Pending"): SavedOffer {
  return {
    offer_id: 5,
    job_id: 3,
    job_request_id: 7,
    marketer_id: 2,
    offered_price: "9000.00",
    delivery_date: "2099-10-25",
    message: "Faculty groups",
    offer_status: status,
    created_at: "2026-10-15T02:00:00Z",
  };
}
export function invitationEntry(
  status: ReceivedRequest["request_status"] = "Accepted",
): InvitationEntry {
  return { request: receivedRequest(status), offer: null, offersUnavailable: false };
}
