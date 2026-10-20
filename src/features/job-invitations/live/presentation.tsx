import { StatusPill } from "@/components/ui/status-pill";
import { formatDate, formatSentDate } from "../format";
import type { ReceivedRequest, SavedOffer } from "./types";

export function jobDisplayTitle(request: ReceivedRequest): string {
  if (request.job.title?.trim()) return request.job.title;
  const surveys = request.job.surveys;
  if (!surveys.length) return `Job #${request.job_id}`;
  if (surveys.length === 1) return surveys[0].title;
  const others = surveys.length - 1;
  return `${surveys[0].title} + ${others} more ${others === 1 ? "survey" : "surveys"}`;
}

export function JobIdentity({ request }: { request: ReceivedRequest }) {
  return (
    <>
      <h2 className="break-words">{jobDisplayTitle(request)}</h2>
      <p className="ji-muted ji-job-id">Job #{request.job_id}</p>
    </>
  );
}

export function invitationStatusLabel(status: ReceivedRequest["request_status"]): string {
  return {
    Pending: "Awaiting your response",
    Accepted: "Invitation accepted",
    Declined: "Invitation declined",
    Closed: "Invitation closed",
  }[status];
}

export function InvitationResponse({ request }: { request: ReceivedRequest }) {
  return (
    <p className="ji-response-time ji-live-response">
      <StatusPill status={request.request_status}>
        {invitationStatusLabel(request.request_status)}
      </StatusPill>
      {request.responded_at && (
        <>
          {" · "}
          <time
            className="ji-muted"
            dateTime={request.responded_at}
            title={formatSentDate(request.responded_at)}
          >
            {formatDate(request.responded_at)}
          </time>
        </>
      )}
    </p>
  );
}

export function LiveOfferStatus({ status }: { status: SavedOffer["offer_status"] }) {
  const label = {
    Pending: "Offer pending review",
    Accepted: "Offer accepted — you’ve been hired",
    Rejected: "Offer rejected",
    Withdrawn: "Offer withdrawn",
  }[status];
  return <StatusPill status={status}>{label}</StatusPill>;
}
