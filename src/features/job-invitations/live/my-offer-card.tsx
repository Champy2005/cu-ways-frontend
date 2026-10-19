"use client";

import Link from "next/link";
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

const badgeColors = {
  Pending: "border-[var(--mk-caution)] text-[var(--mk-caution)]",
  Accepted: "border-[var(--mk-positive)] text-[var(--mk-positive)]",
  Withdrawn: "border-[var(--mk-border)] text-[var(--mk-muted)]",
  Rejected: "border-[var(--mk-error)] text-[var(--mk-error)]",
};

export function MyOfferCard({
  offer,
  request,
  onWithdrawClick,
  disabled = false,
  isCurrent = true,
}: MyOfferCardProps) {
  const jobTitle = request.job.surveys[0]?.title ?? "Job #" + request.job_id;
  const date = offer.delivery_date ?? request.job.deadline;
  const canResubmit = isCurrent && !disabled && canResubmitOffer(offer, request);
  return (
    <article
      data-testid={"my-offer-card-" + offer.offer_id}
      className="rounded-2xl border border-[var(--mk-border)] bg-[var(--mk-surface)] p-4 text-[var(--mk-text)] shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold leading-snug wrap-anywhere">{jobTitle}</h2>
        <span
          className={
            "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold " +
            badgeColors[offer.offer_status]
          }
        >
          {offer.offer_status}
        </span>
      </div>
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
      {offer.offer_status === "Pending" && (
        <Button
          type="button"
          disabled={disabled}
          onClick={(event) => onWithdrawClick(offer, jobTitle, event.currentTarget)}
          className="w-full bg-[#b42318] text-white hover:bg-[#912018]"
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
          className="mt-2 block w-full rounded-xl bg-[#c1225d] px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-[#a91b4f] focus-visible:outline-2 focus-visible:outline-offset-2"
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
