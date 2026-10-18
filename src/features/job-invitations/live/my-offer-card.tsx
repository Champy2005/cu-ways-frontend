"use client";

import Link from "next/link";
import { Calendar } from "lucide-react";
import type { ReceivedRequest, SavedOffer } from "./types";
import { formatDate } from "../format";

export type MyOfferCardProps = {
  offer: SavedOffer;
  request: ReceivedRequest;
  onWithdrawClick: (offer: SavedOffer, title: string) => void;
};

function formatDueLabel(offer: SavedOffer, request: ReceivedRequest): string {
  const dateStr = offer.delivery_date ?? request.job.deadline;
  if (!dateStr) return "Flexible delivery";
  return `Due ${formatDate(dateStr)}`;
}

function StatusBadge({ status }: { status: SavedOffer["offer_status"] }) {
  if (status === "Pending") {
    return (
      <span className="rounded-full border border-[#f59e0b]/40 bg-[#3d3319] px-2.5 py-0.5 text-xs font-semibold text-[#fbbf24]">
        Pending
      </span>
    );
  }
  if (status === "Accepted") {
    return (
      <span className="rounded-full border border-[#10b981]/40 bg-[#064e3b] px-2.5 py-0.5 text-xs font-semibold text-[#34d399]">
        Accepted
      </span>
    );
  }
  if (status === "Withdrawn") {
    return (
      <span className="rounded-full border border-white/10 bg-[#27272a] px-2.5 py-0.5 text-xs font-semibold text-[#a1a1aa]">
        Withdrawn
      </span>
    );
  }
  return (
    <span className="rounded-full border border-rose-800/40 bg-rose-950/60 px-2.5 py-0.5 text-xs font-semibold text-rose-400">
      Rejected
    </span>
  );
}

export function MyOfferCard({ offer, request, onWithdrawClick }: MyOfferCardProps) {
  const jobTitle = request.job.surveys[0]?.title ?? `Job #${request.job_id}`;
  const priceNumber = Number(offer.offered_price);
  const formattedPrice = Number.isFinite(priceNumber)
    ? priceNumber.toLocaleString("en-US", { maximumFractionDigits: 2 })
    : offer.offered_price;

  return (
    <article
      data-testid={`my-offer-card-${offer.offer_id}`}
      className="rounded-2xl border border-[var(--mk-border,#262a36)] bg-[var(--mk-surface,#131722)] p-4 shadow-sm"
    >
      {/* Top Header: Title + Status Badge */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-white leading-snug line-clamp-2">{jobTitle}</h3>
        <div className="shrink-0">
          <StatusBadge status={offer.offer_status} />
        </div>
      </div>

      {/* Middle Row: Price on left, Due date on right */}
      <div className="my-3 flex items-end justify-between">
        <div>
          <span className="text-xs text-[var(--mk-muted,#8f96a3)] block mb-0.5">Offered price</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold tracking-tight text-white">{formattedPrice}</span>
            <span className="text-xs font-medium text-[var(--mk-muted,#8f96a3)]">THB</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[var(--mk-muted,#8f96a3)]">
          <Calendar aria-hidden="true" className="size-3.5" />
          <span>{formatDueLabel(offer, request)}</span>
        </div>
      </div>

      {/* Action Button */}
      {offer.offer_status === "Pending" && (
        <button
          type="button"
          onClick={() => onWithdrawClick(offer, jobTitle)}
          className="w-full rounded-xl bg-[#d94f57] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#c93f3f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
        >
          Withdraw offer
        </button>
      )}

      {offer.offer_status === "Accepted" && (
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="w-full rounded-xl bg-[#3b2328] px-4 py-2.5 text-sm font-semibold text-[#8e6871] opacity-60 cursor-not-allowed"
        >
          Withdraw offer
        </button>
      )}

      {offer.offer_status === "Withdrawn" && (
        <Link
          href={`/marketer/offer/create?requestId=${request.job_request_id}`}
          className="block w-full text-center rounded-xl bg-[#ec4899] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#db2777] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
        >
          Resubmit offer
        </Link>
      )}

      {offer.offer_status === "Rejected" && (
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="w-full rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-500 cursor-not-allowed opacity-60"
        >
          Offer rejected
        </button>
      )}
    </article>
  );
}
