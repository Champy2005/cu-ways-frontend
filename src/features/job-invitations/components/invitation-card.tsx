"use client";

import { FileText, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Invitation, Offer } from "../types";
import { formatDate, formatPrice, formatSentDate, formatSentTime } from "../format";
import { OfferStatusText } from "./shared";

export function InvitationCard({
  request,
  referenceTime,
  offer,
  onRespond,
  onOffer,
  onBrief,
}: {
  request: Invitation;
  referenceTime: string;
  offer?: Offer;
  onRespond: (request: Invitation, mode: "accept" | "decline", trigger: HTMLElement) => void;
  onOffer: (id: string) => void;
  onBrief: (request: Invitation, trigger: HTMLElement) => void;
}) {
  return (
    <Card className="ji-card">
      <CardContent className="ji-request">
        <div className="ji-card-top">
          <p className="ji-creator">{request.creator}</p>
          <time
            className="ji-sent-time"
            data-status={request.status}
            dateTime={request.invitedAt}
            title={formatSentDate(request.invitedAt)}
            aria-label={`${formatSentTime(request.invitedAt, referenceTime)}. Status: ${request.status}`}
            aria-description={`Sent ${formatSentDate(request.invitedAt)}`}
          >
            {formatSentTime(request.invitedAt, referenceTime)}
          </time>
        </div>
        <h2>{request.job.title}</h2>
        <p className="ji-muted ji-job-id">{request.job.id}</p>
        <div className="ji-tags">
          <span>{formatPrice(request.job.budget)} fixed</span>
          <span>Deadline: {formatDate(request.job.deadline)}</span>
        </div>
        <p className="ji-inset ji-message">{request.message}</p>
        <p className="ji-surveys">
          {request.job.surveys.length} {request.job.surveys.length === 1 ? "survey" : "surveys"}{" "}
          attached ({request.job.surveys.map((survey) => survey.title).join(", ")} · Target:{" "}
          {request.job.target} responses)
        </p>
        <Button
          variant="ghost"
          className="ji-brief ji-accent"
          onClick={(event) => onBrief(request, event.currentTarget)}
        >
          <FileText size={15} aria-hidden="true" />
          {request.job.brief.title}
          <ArrowUpRight size={14} aria-hidden="true" />
        </Button>
        {request.respondedAt && (
          <p className="ji-muted ji-response-time">
            {request.status} {formatDate(request.respondedAt)}
          </p>
        )}
        {request.status === "Declined" && (request.declineReason || request.declineNote) && (
          <p className="ji-muted ji-message">
            {[request.declineReason, request.declineNote].filter(Boolean).join(". ")}
          </p>
        )}
        {offer && (
          <p className="ji-offer-status">
            <OfferStatusText status={offer.status} />
            <span>· {formatPrice(offer.price)}</span>
          </p>
        )}
        {request.status === "Pending" && (
          <div className="ji-actions">
            <Button
              variant="outline"
              className="ji-decline"
              onClick={(event) => onRespond(request, "decline", event.currentTarget)}
            >
              Decline
            </Button>
            <Button
              className="ji-primary"
              onClick={(event) => onRespond(request, "accept", event.currentTarget)}
            >
              Accept Request
            </Button>
          </div>
        )}
        {request.status === "Accepted" && (
          <Button
            className={offer ? "ji-secondary w-full" : "ji-primary w-full"}
            variant={offer ? "outline" : "default"}
            onClick={() => onOffer(request.id)}
          >
            {offer ? "View Offer" : "Submit Offer"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
