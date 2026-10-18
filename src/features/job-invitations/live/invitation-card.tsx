"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice, formatSentDate, formatSentTime } from "../format";
import {
  InvitationResponse,
  JobIdentity,
  LiveOfferStatus,
  invitationStatusLabel,
} from "./presentation";
import type { InvitationEntry, ReceivedRequest, SavedOffer } from "./types";
import { JobDetails } from "./job-details";

function DeclineMessage({ reason, note }: { reason?: string | null; note?: string | null }) {
  const text = [reason, note].filter(Boolean).join(". ");
  if (!text) return null;
  return <p className="ji-muted ji-message">{text}</p>;
}

function PendingActions({
  blocked,
  jobPending,
  onRespond,
}: {
  blocked: boolean;
  jobPending: boolean;
  onRespond: (mode: "accept" | "decline", trigger: HTMLElement) => void;
}) {
  return (
    <div className="ji-actions">
      <Button
        variant="outline"
        className="ji-decline"
        disabled={blocked || !jobPending}
        onClick={(event) => onRespond("decline", event.currentTarget)}
      >
        Decline
      </Button>
      <Button
        className="ji-primary"
        disabled={blocked || !jobPending}
        onClick={(event) => onRespond("accept", event.currentTarget)}
      >
        Accept Request
      </Button>
    </div>
  );
}

function OfferActionLink({
  offer,
  request,
  offersUnavailable,
}: {
  offer: SavedOffer | null;
  request: ReceivedRequest;
  offersUnavailable: boolean;
}) {
  const canSubmit =
    request.request_status === "Accepted" &&
    request.job.job_status === "Pending" &&
    !offersUnavailable;

  if (!offer && !canSubmit) return null;

  const isPending = offer?.offer_status === "Pending";
  const isWithdrawn = offer?.offer_status === "Withdrawn";

  return (
    <Link
      href={
        isPending
          ? "/marketer/offers"
          : `/marketer/offer/create?requestId=${request.job_request_id}`
      }
      className={cn(
        buttonVariants({ variant: offer ? "outline" : "default" }),
        offer ? "ji-secondary" : "ji-primary",
        "w-full ji-live-offer-link",
      )}
    >
      {offer ? (isWithdrawn ? "Resubmit Offer" : "View Offer") : "Submit Offer"}
    </Link>
  );
}

export function LiveInvitationCard({
  entry,
  referenceTime,
  blocked,
  onRespond,
  onRetry,
  retrying,
}: {
  entry: InvitationEntry;
  referenceTime: string;
  blocked: boolean;
  onRespond: (mode: "accept" | "decline", trigger: HTMLElement) => void;
  onRetry: () => void;
  retrying: boolean;
}) {
  const { request, offer, offersUnavailable } = entry;
  const isDeclined = request.request_status === "Declined";
  const isPending = request.request_status === "Pending";
  const jobPending = request.job.job_status === "Pending";

  return (
    <Card className="ji-card">
      <CardContent className="ji-request">
        <div className="ji-card-top">
          <p className="ji-creator break-words">{request.job.creator.name}</p>
          <time
            className="ji-sent-time"
            data-status={request.request_status}
            dateTime={request.created_at}
            title={formatSentDate(request.created_at)}
            aria-label={`${formatSentTime(request.created_at, referenceTime)}. ${invitationStatusLabel(request.request_status)}`}
          >
            {formatSentTime(request.created_at, referenceTime)}
          </time>
        </div>
        <JobIdentity request={request} />
        <JobDetails request={request} />
        <InvitationResponse request={request} />
        {isDeclined && (
          <DeclineMessage reason={request.decline_reason} note={request.decline_note} />
        )}
        {offer && (
          <p className="ji-offer-status">
            <LiveOfferStatus status={offer.offer_status} /> · {formatPrice(offer.offered_price)}
          </p>
        )}
        {!offer && !jobPending && (
          <p className="ji-live-job-unavailable">This job is no longer accepting offers.</p>
        )}
        {offersUnavailable && (
          <div className="my-4 text-sm">
            <p role="alert">Offers could not be loaded. Refresh before submitting an offer.</p>
            <Button
              variant="ghost"
              size="sm"
              className="ji-accent h-auto px-0 underline"
              onClick={onRetry}
              disabled={retrying}
            >
              {retrying ? "Retrying…" : "Try again"}
            </Button>
          </div>
        )}
        {isPending && (
          <PendingActions blocked={blocked} jobPending={jobPending} onRespond={onRespond} />
        )}
        <OfferActionLink offer={offer} request={request} offersUnavailable={offersUnavailable} />
      </CardContent>
    </Card>
  );
}
