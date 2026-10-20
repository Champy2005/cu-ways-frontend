"use client";

import Link from "next/link";
import { StatusText } from "@/components/ui/status-text";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReceivedRequest, SavedOffer } from "./types";
import { formatDate, formatPrice } from "../format";
import { canResubmitOffer } from "./offer-eligibility";

export type MyOfferCardProps = {
  offer: SavedOffer;
  request: ReceivedRequest;
  disabled?: boolean;
  isCurrent?: boolean;
  onWithdrawClick: (offer: SavedOffer, title: string, trigger: HTMLElement) => void;
};

export function MyOfferCard({
  offer,
  request,
  onWithdrawClick,
  disabled = false,
  isCurrent = true,
}: MyOfferCardProps) {
  const jobTitle = request.job.title || request.job.surveys[0]?.title || "Job #" + request.job_id;
  const date = offer.delivery_date ?? request.job.deadline;
  const canResubmit = isCurrent && !disabled && canResubmitOffer(offer, request);
  return (
    <article data-testid={"my-offer-card-" + offer.offer_id} className="ji-card ji-request min-w-0">
      <div className="ji-card-top">
        <p className="ji-creator min-w-0 break-words">{request.job.creator.name}</p>
        <StatusText status={offer.offer_status} />
      </div>
      <h2 className="wrap-anywhere">{jobTitle}</h2>
      <p className="ji-muted ji-job-id">Job #{request.job_id}</p>
      <p className="mt-2 text-xs text-[var(--mk-muted)]">
        {isCurrent ? "Submitted " : "Previous offer · Submitted "}
        {formatDate(offer.created_at)}
      </p>
      <div className="my-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="mb-0.5 block text-xs text-[var(--mk-muted)]">Offered price</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold tracking-tight">
              {formatPrice(offer.offered_price).slice(1)}
            </span>
            <span className="text-xs font-medium text-[var(--mk-muted)]">THB</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--mk-muted)]">
          <Calendar aria-hidden="true" className="size-3.5" />
          <span>{date ? "Due " + formatDate(date) : "Flexible delivery"}</span>
        </div>
      </div>
      {offer.message && (
        <p className="mb-3 text-sm whitespace-pre-wrap wrap-anywhere">{offer.message}</p>
      )}
      {isCurrent && (
        <Link
          href={`/marketer/offer/create?requestId=${request.job_request_id}`}
          className="ji-secondary mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl border px-4 text-sm font-semibold"
        >
          View offer
        </Link>
      )}
      {offer.offer_status === "Pending" && (
        <Button
          type="button"
          disabled={disabled}
          onClick={(event) => onWithdrawClick(offer, jobTitle, event.currentTarget)}
          variant="outline"
          className="mt-3 w-full border-[var(--mk-border)] bg-transparent text-[var(--mk-error)] hover:bg-[var(--mk-coral-soft)]"
        >
          Withdraw offer
        </Button>
      )}
      {offer.offer_status === "Accepted" && (
        <Button type="button" disabled className="w-full">
          Withdraw offer
        </Button>
      )}
      {canResubmit && (
        <Link
          href={"/marketer/offer/create?requestId=" + request.job_request_id}
          className="mk-primary-button mt-3 inline-flex min-h-12 w-full items-center justify-center px-4 text-sm font-semibold"
        >
          Resubmit offer
        </Link>
      )}
      {offer.offer_status === "Withdrawn" && !canResubmit && (
        <p className="text-xs text-[var(--mk-muted)]">
          {isCurrent
            ? "Resubmission is unavailable. The invitation and job must still be open."
            : "A newer offer has been submitted for this invitation."}
        </p>
      )}
      {offer.offer_status === "Rejected" && (
        <Button type="button" disabled className="w-full">
          Offer rejected
        </Button>
      )}
    </article>
  );
}
