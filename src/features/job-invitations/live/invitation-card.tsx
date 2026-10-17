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
import type { InvitationEntry } from "./types";
import { JobDetails } from "./job-details";

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
        {request.request_status === "Declined" &&
          (request.decline_reason || request.decline_note) && (
            <p className="ji-muted ji-message">
              {[request.decline_reason, request.decline_note].filter(Boolean).join(". ")}
            </p>
          )}
        {offer && (
          <p className="ji-offer-status">
            <LiveOfferStatus status={offer.offer_status} /> · {formatPrice(offer.offered_price)}
          </p>
        )}
        {!offer && request.job.job_status !== "Pending" && (
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
        {request.request_status === "Pending" && (
          <div className="ji-actions">
            <Button
              variant="outline"
              className="ji-decline"
              disabled={blocked || request.job.job_status !== "Pending"}
              onClick={(event) => onRespond("decline", event.currentTarget)}
            >
              Decline
            </Button>
            <Button
              className="ji-primary"
              disabled={blocked || request.job.job_status !== "Pending"}
              onClick={(event) => onRespond("accept", event.currentTarget)}
            >
              Accept Request
            </Button>
          </div>
        )}
        {(offer ||
          (request.request_status === "Accepted" &&
            request.job.job_status === "Pending" &&
            !offersUnavailable)) && (
          <Link
            href={`/marketer/offer/create?requestId=${request.job_request_id}`}
            className={cn(
              buttonVariants({ variant: offer ? "outline" : "default" }),
              offer ? "ji-secondary" : "ji-primary",
              "w-full ji-live-offer-link",
            )}
          >
            {offer ? "View Offer" : "Submit Offer"}
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
