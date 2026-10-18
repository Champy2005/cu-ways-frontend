"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  MapPin,
  MessageSquare,
  Sparkles,
  Star,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { MarketerAvatar } from "@/features/marketer-discovery/components/marketer-avatar";
import { formatBaht, formatYears } from "@/features/marketer-discovery/format";
import type { JobOfferComparison } from "@/features/jobs/types";

export type JobOfferCardProps = {
  comparison: JobOfferComparison;
};

export function formatOfferDate(dateString: string | null | undefined): string {
  if (!dateString) return "Not specified";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusBadgeClass(status: JobOfferComparison["offer_status"]): string {
  switch (status) {
    case "Accepted":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "Pending":
      return "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "Rejected":
      return "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400";
    case "Withdrawn":
      return "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400";
    default:
      return "border-[var(--mk-border)] bg-[var(--mk-field)] text-[var(--mk-text)]";
  }
}

export function JobOfferCard({ comparison }: JobOfferCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { marketer, rating, offered_price, delivery_date, message, offer_status, created_at } =
    comparison;

  const priceNumber = Number(offered_price);
  const formattedPrice = isNaN(priceNumber) ? offered_price : formatBaht(priceNumber);
  const isRated = rating.is_rated && rating.average_rating !== null;

  return (
    <article
      data-testid={`job-offer-card-${comparison.offer_id}`}
      className="flex flex-col justify-between rounded-2xl border border-[var(--mk-border)] bg-[var(--mk-surface)] p-5 shadow-[var(--mk-shadow)] transition-all hover:border-[var(--mk-accent)] sm:p-6"
    >
      <div>
        {/* Top Header: Marketer info & Offer Status */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--mk-border)] pb-4">
          <div className="flex items-center gap-3.5">
            <MarketerAvatar name={marketer.name} size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-[var(--mk-text)]">{marketer.name}</h3>
                <span className="text-xs text-[var(--mk-muted)]">
                  • {formatYears(marketer.experience_years)}
                </span>
              </div>

              {/* Rating representation - handles unrated state */}
              <div className="mt-1 flex items-center gap-1.5 text-xs">
                {isRated ? (
                  <>
                    <Star aria-hidden="true" className="size-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-medium text-[var(--mk-text)]">
                      {rating.average_rating!.toFixed(1)}
                    </span>
                    <span className="text-[var(--mk-muted)]">
                      ({rating.review_count} {rating.review_count === 1 ? "review" : "reviews"} •{" "}
                      {rating.completed_jobs} completed)
                    </span>
                  </>
                ) : (
                  <span
                    data-testid="unrated-badge"
                    className="inline-flex items-center rounded-full bg-[var(--mk-field)] px-2 py-0.5 text-xs font-medium text-[var(--mk-muted)]"
                  >
                    No ratings yet
                  </span>
                )}
              </div>
            </div>
          </div>

          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(
              offer_status,
            )}`}
          >
            {offer_status}
          </span>
        </div>

        {/* Pricing & Delivery Summary */}
        <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--mk-border)] bg-[var(--mk-field)] p-3.5">
            <p className="text-xs font-medium text-[var(--mk-muted)]">Offered Price</p>
            <p className="mt-1 text-xl font-bold tracking-tight text-[var(--mk-accent)]">
              {formattedPrice}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--mk-border)] bg-[var(--mk-field)] p-3.5">
            <p className="text-xs font-medium text-[var(--mk-muted)]">Estimated Delivery</p>
            <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[var(--mk-text)]">
              <Calendar aria-hidden="true" className="size-4 text-[var(--mk-accent)]" />
              <span>{formatOfferDate(delivery_date)}</span>
            </div>
          </div>
        </div>

        {/* Note / Message from Marketer */}
        {message && (
          <div className="mb-4 rounded-xl border border-[var(--mk-border)] bg-[var(--mk-field)]/60 p-3.5">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[var(--mk-muted)]">
              <MessageSquare aria-hidden="true" className="size-3.5" />
              <span>Message from marketer</span>
            </div>
            <p className="text-sm italic text-[var(--mk-text)]">&quot;{message}&quot;</p>
          </div>
        )}

        {/* Submission Timestamp */}
        <div className="flex items-center gap-1.5 text-xs text-[var(--mk-muted)]">
          <Clock aria-hidden="true" className="size-3.5" />
          <span>Submitted on {formatOfferDate(created_at)}</span>
        </div>

        {/* Expandable Marketer Profile Details (Decision 4) */}
        {isExpanded && (
          <div
            data-testid={`expanded-details-${comparison.offer_id}`}
            className="mt-4 space-y-4 rounded-xl border border-[var(--mk-border)] bg-[var(--mk-field)]/40 p-4 text-sm"
          >
            {/* Bio */}
            {marketer.bio && (
              <div>
                <p className="text-xs font-medium text-[var(--mk-muted)]">Bio</p>
                <p className="mt-1 text-sm text-[var(--mk-text)]">{marketer.bio}</p>
              </div>
            )}

            {/* Availability */}
            <div>
              <p className="text-xs font-medium text-[var(--mk-muted)]">Availability</p>
              <p className="mt-1 text-sm font-medium capitalize text-[var(--mk-text)]">
                {marketer.availability_status}
                {marketer.availability_text ? ` · ${marketer.availability_text}` : ""}
              </p>
            </div>

            {/* Expertise Tags */}
            {marketer.expertise && marketer.expertise.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[var(--mk-muted)]">Expertise</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {marketer.expertise.map((exp) => (
                    <span
                      key={exp.slug}
                      className="inline-flex items-center gap-1 rounded-md border border-[var(--mk-border)] bg-[var(--mk-surface)] px-2 py-0.5 text-xs text-[var(--mk-text)]"
                    >
                      <Sparkles aria-hidden="true" className="size-3 text-[var(--mk-accent)]" />
                      {exp.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Campuses */}
            {marketer.campuses && marketer.campuses.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[var(--mk-muted)]">Campuses</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {marketer.campuses.map((campus) => (
                    <span
                      key={campus.slug}
                      className="inline-flex items-center gap-1 rounded-md border border-[var(--mk-border)] bg-[var(--mk-surface)] px-2 py-0.5 text-xs text-[var(--mk-text)]"
                    >
                      <MapPin aria-hidden="true" className="size-3 text-[var(--mk-accent)]" />
                      {campus.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Rating Breakdown */}
            <div className="rounded-lg border border-[var(--mk-border)] bg-[var(--mk-surface)] p-3">
              <p className="text-xs font-semibold text-[var(--mk-text)]">
                Historical Rating Summary
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="block text-[var(--mk-muted)]">Average</span>
                  <span className="mt-0.5 font-bold text-[var(--mk-text)]">
                    {isRated ? `${rating.average_rating!.toFixed(1)} / 5.0` : "Unrated"}
                  </span>
                </div>
                <div>
                  <span className="block text-[var(--mk-muted)]">Reviews</span>
                  <span className="mt-0.5 font-bold text-[var(--mk-text)]">
                    {rating.review_count}
                  </span>
                </div>
                <div>
                  <span className="block text-[var(--mk-muted)]">Completed</span>
                  <span className="mt-0.5 font-bold text-[var(--mk-text)]">
                    {rating.completed_jobs}
                  </span>
                </div>
              </div>
            </div>

            {/* View Full Profile link */}
            <div className="pt-2">
              <Link
                href={`/marketers/${marketer.user_id}`}
                className="mk-secondary-button inline-flex min-h-10 w-full items-center justify-center gap-2 px-4 text-xs font-semibold"
              >
                <User aria-hidden="true" className="size-3.5" />
                View Full Profile & Packages
                <ExternalLink aria-hidden="true" className="size-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Expand/Collapse Toggle Button */}
      <div className="mt-4 border-t border-[var(--mk-border)] pt-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex min-h-9 w-full items-center justify-center gap-1.5 text-xs font-medium text-[var(--mk-muted)] hover:text-[var(--mk-text)]"
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <>
              <span>Hide marketer details</span>
              <ChevronUp aria-hidden="true" className="size-4" />
            </>
          ) : (
            <>
              <span>View marketer details & rating breakdown</span>
              <ChevronDown aria-hidden="true" className="size-4" />
            </>
          )}
        </Button>
      </div>
    </article>
  );
}
