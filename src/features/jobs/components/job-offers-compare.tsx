"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, Briefcase, Filter, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { JobOfferCard } from "@/features/jobs/components/job-offer-card";
import type { JobOfferComparison, OfferStatus } from "@/features/jobs/types";

export type SortOption =
  "price_asc" | "price_desc" | "rating_desc" | "date_newest" | "delivery_earliest";

export type JobOffersCompareProps = {
  jobId: number;
  offers: JobOfferComparison[];
  error?: string;
};

export function JobOffersCompare({ jobId, offers, error }: JobOffersCompareProps) {
  const [selectedStatus, setSelectedStatus] = useState<"All" | OfferStatus>("All");
  const [sortBy, setSortBy] = useState<SortOption>("price_asc");

  // Filtering
  const filteredOffers = useMemo(() => {
    if (selectedStatus === "All") return offers;
    return offers.filter((item) => item.offer_status === selectedStatus);
  }, [offers, selectedStatus]);

  // Sorting
  const sortedOffers = useMemo(() => {
    return [...filteredOffers].sort((a, b) => {
      switch (sortBy) {
        case "price_asc":
          return Number(a.offered_price) - Number(b.offered_price);
        case "price_desc":
          return Number(b.offered_price) - Number(a.offered_price);
        case "rating_desc": {
          // Sort rated marketers first, then by average rating descending
          const aRating =
            a.rating.is_rated && a.rating.average_rating !== null ? a.rating.average_rating : -1;
          const bRating =
            b.rating.is_rated && b.rating.average_rating !== null ? b.rating.average_rating : -1;
          if (bRating !== aRating) return bRating - aRating;
          // Tiebreak with review count then completed jobs
          if (b.rating.review_count !== a.rating.review_count) {
            return b.rating.review_count - a.rating.review_count;
          }
          return b.rating.completed_jobs - a.rating.completed_jobs;
        }
        case "delivery_earliest": {
          const aTime = a.delivery_date ? new Date(a.delivery_date).getTime() : Infinity;
          const bTime = b.delivery_date ? new Date(b.delivery_date).getTime() : Infinity;
          return aTime - bTime;
        }
        case "date_newest":
        default: {
          const aTime = new Date(a.created_at).getTime();
          const bTime = new Date(b.created_at).getTime();
          return bTime - aTime;
        }
      }
    });
  }, [filteredOffers, sortBy]);

  // Offer status counts
  const counts = useMemo(() => {
    const summary = {
      all: offers.length,
      pending: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0,
    };
    for (const o of offers) {
      if (o.offer_status === "Pending") summary.pending++;
      else if (o.offer_status === "Accepted") summary.accepted++;
      else if (o.offer_status === "Rejected") summary.rejected++;
      else if (o.offer_status === "Withdrawn") summary.withdrawn++;
    }
    return summary;
  }, [offers]);

  if (error) {
    return (
      <div className="mk-error-notice rounded-2xl p-5" role="alert">
        <p className="font-semibold text-[var(--mk-text)]">Unable to load offers</p>
        <p className="mt-1 text-sm text-[var(--mk-muted)]">{error}</p>
        <div className="mt-4 flex gap-3">
          <Link
            href={`/creator/jobs/${jobId}/offers`}
            className="mk-secondary-button inline-flex min-h-10 items-center justify-center px-4 text-xs font-semibold"
          >
            Retry
          </Link>
          <Link
            href="/creator/dashboard"
            className="mk-secondary-button inline-flex min-h-10 items-center justify-center px-4 text-xs font-semibold"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <Card className="mk-card mk-card-padding flex flex-col items-center justify-center py-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-[var(--mk-accent-soft)] text-[var(--mk-accent)]">
          <Briefcase aria-hidden="true" className="size-7" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-[var(--mk-text)]">
          No offers submitted yet
        </h2>
        <p className="mt-2 max-w-md text-sm text-[var(--mk-muted)]">
          Marketers have not submitted any offers for this job yet. You can invite qualified
          marketers to submit their proposals.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/creator/jobs/${jobId}/invite`}
            className="mk-primary-button inline-flex min-h-11 items-center justify-center gap-2 px-5 text-sm font-semibold"
          >
            <UserPlus aria-hidden="true" className="size-4" />
            Invite Marketers
          </Link>
          <Link
            href="/creator/dashboard"
            className="mk-secondary-button inline-flex min-h-11 items-center justify-center px-5 text-sm font-semibold"
          >
            Return to Dashboard
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls: Filter Tabs & Sort Dropdown */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--mk-border)] pb-4">
        {/* Status Filter Chips */}
        <div
          role="tablist"
          aria-label="Filter offers by status"
          className="flex flex-wrap items-center gap-1.5"
        >
          {(
            [
              { key: "All", label: `All (${counts.all})` },
              { key: "Pending", label: `Pending (${counts.pending})` },
              { key: "Accepted", label: `Accepted (${counts.accepted})` },
              { key: "Rejected", label: `Rejected (${counts.rejected})` },
              { key: "Withdrawn", label: `Withdrawn (${counts.withdrawn})` },
            ] as const
          ).map((tab) => {
            const isActive = selectedStatus === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedStatus(tab.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-[var(--mk-accent)] text-white shadow-sm"
                    : "border border-[var(--mk-border)] bg-[var(--mk-surface)] text-[var(--mk-muted)] hover:text-[var(--mk-text)]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <ArrowUpDown aria-hidden="true" className="size-4 text-[var(--mk-muted)]" />
          <label htmlFor="offer-sort-select" className="text-xs font-medium text-[var(--mk-muted)]">
            Sort by:
          </label>
          <select
            id="offer-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-lg border border-[var(--mk-border)] bg-[var(--mk-surface)] px-3 py-1.5 text-xs font-medium text-[var(--mk-text)] shadow-sm outline-none focus:border-[var(--mk-accent)]"
          >
            <option value="price_asc">Price: Lowest first</option>
            <option value="price_desc">Price: Highest first</option>
            <option value="rating_desc">Rating: Highest first</option>
            <option value="delivery_earliest">Delivery: Earliest first</option>
            <option value="date_newest">Submission: Newest first</option>
          </select>
        </div>
      </div>

      {/* Offers Results Summary */}
      <div className="flex items-center justify-between text-xs text-[var(--mk-muted)]">
        <span>
          Showing {sortedOffers.length} {sortedOffers.length === 1 ? "offer" : "offers"}
          {selectedStatus !== "All" ? ` (${selectedStatus})` : ""}
        </span>

        <Link
          href={`/creator/jobs/${jobId}/invite`}
          className="inline-flex items-center gap-1.5 font-semibold text-[var(--mk-accent)] hover:underline"
        >
          <UserPlus aria-hidden="true" className="size-3.5" />
          Invite more marketers
        </Link>
      </div>

      {/* Offers Grid / List */}
      {sortedOffers.length === 0 ? (
        <Card className="mk-card mk-card-padding py-8 text-center">
          <Filter aria-hidden="true" className="mx-auto size-6 text-[var(--mk-muted)]" />
          <p className="mt-2 text-sm font-medium text-[var(--mk-text)]">
            No {selectedStatus} offers found
          </p>
          <p className="mt-1 text-xs text-[var(--mk-muted)]">
            Try switching the status filter to see other offers.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setSelectedStatus("All")}
            className="mk-secondary-button mt-4 text-xs font-medium"
          >
            Reset filter
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {sortedOffers.map((offer) => (
            <JobOfferCard key={offer.offer_id} comparison={offer} />
          ))}
        </div>
      )}
    </div>
  );
}
