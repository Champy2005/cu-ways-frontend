"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobOfferCard } from "@/features/jobs/components/job-offer-card";
import type { JobOfferComparison, OfferStatus } from "@/features/jobs/types";
import "../offers.css";

export type SortOption =
  "price_asc" | "price_desc" | "rating_desc" | "date_newest" | "delivery_earliest";
export type JobOffersCompareProps = {
  jobId: number;
  offers: JobOfferComparison[];
  error?: string;
  canInvite?: boolean;
  canAccept?: boolean;
  pending?: boolean;
  onAccept?: (offer: JobOfferComparison, trigger: HTMLElement) => void;
};

function compareOffers(a: JobOfferComparison, b: JobOfferComparison, sortBy: SortOption) {
  switch (sortBy) {
    case "price_asc":
      return Number(a.offered_price) - Number(b.offered_price);
    case "price_desc":
      return Number(b.offered_price) - Number(a.offered_price);
    case "rating_desc": {
      const aRating =
        a.rating.is_rated && a.rating.average_rating !== null ? a.rating.average_rating : -1;
      const bRating =
        b.rating.is_rated && b.rating.average_rating !== null ? b.rating.average_rating : -1;
      return (
        bRating - aRating ||
        b.rating.review_count - a.rating.review_count ||
        b.rating.completed_jobs - a.rating.completed_jobs
      );
    }
    case "delivery_earliest":
      return (
        (a.delivery_date ? Date.parse(a.delivery_date) : Infinity) -
        (b.delivery_date ? Date.parse(b.delivery_date) : Infinity)
      );
    default:
      return Date.parse(b.created_at) - Date.parse(a.created_at);
  }
}

export function JobOffersCompare({
  jobId,
  offers,
  error,
  canInvite = true,
  canAccept = false,
  pending = false,
  onAccept,
}: JobOffersCompareProps) {
  const [selectedStatus, setSelectedStatus] = useState<"All" | OfferStatus>("All");
  const [sortBy, setSortBy] = useState<SortOption>("price_asc");
  const allTab = useRef<HTMLButtonElement>(null);
  const sortedOffers = useMemo(
    () =>
      offers
        .filter((offer) => selectedStatus === "All" || offer.offer_status === selectedStatus)
        .sort((a, b) => compareOffers(a, b, sortBy)),
    [offers, selectedStatus, sortBy],
  );
  if (error)
    return (
      <div className="jo-empty" role="alert">
        <h2>Unable to load offers</h2>
        <p>{error}</p>
        <a className="jo-invite" href={`/creator/jobs/${jobId}/offers`}>
          Retry
        </a>
      </div>
    );
  if (offers.length === 0)
    return (
      <div className="jo-empty">
        <h2>No offers submitted yet</h2>
        <p>
          {canInvite
            ? "Invite marketers to submit their proposals for this job."
            : "There are no offers to display for this job."}
        </p>
        {canInvite && (
          <Link className="jo-invite" href={`/creator/jobs/${jobId}/invite`}>
            Invite marketers
          </Link>
        )}
      </div>
    );
  return (
    <Tabs
      value={selectedStatus}
      onValueChange={(value) => setSelectedStatus(value as "All" | OfferStatus)}
    >
      <div className="jo-controls">
        <div className="jo-tabs-scroll">
          <TabsList variant="line" className="jo-tabs" aria-label="Filter offers by status">
            {(["All", "Pending", "Accepted", "Rejected", "Withdrawn"] as const).map((status) => (
              <TabsTrigger key={status} value={status} ref={status === "All" ? allTab : undefined}>
                {status} (
                {status === "All"
                  ? offers.length
                  : offers.filter((offer) => offer.offer_status === status).length}
                )
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div className="jo-sort">
          <label htmlFor="offer-sort-select">Sort by:</label>
          <select
            id="offer-sort-select"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortOption)}
          >
            <option value="price_asc">Price: Lowest first</option>
            <option value="price_desc">Price: Highest first</option>
            <option value="rating_desc">Rating: Highest first</option>
            <option value="delivery_earliest">Delivery: Earliest first</option>
            <option value="date_newest">Submission: Newest first</option>
          </select>
        </div>
      </div>
      <TabsContent value={selectedStatus}>
        <p className="jo-result-count">
          Showing {sortedOffers.length} {sortedOffers.length === 1 ? "offer" : "offers"}
          {selectedStatus !== "All" ? ` (${selectedStatus})` : ""}
        </p>
        {sortedOffers.length === 0 ? (
          <div className="jo-empty">
            <h2>No {selectedStatus} offers found</h2>
            <p>Try another status to see more offers.</p>
            <Button
              variant="outline"
              className="jo-secondary"
              onClick={() => {
                setSelectedStatus("All");
                allTab.current?.focus();
              }}
            >
              Reset filter
            </Button>
          </div>
        ) : (
          <div className="jo-grid">
            {sortedOffers.map((offer) => (
              <JobOfferCard
                key={offer.offer_id}
                comparison={offer}
                canAccept={canAccept}
                pending={pending}
                onAccept={onAccept}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
