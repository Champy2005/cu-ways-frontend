"use client";

import { StatusText } from "@/components/ui/status-text";

import { useRef, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketerAvatar } from "@/features/marketer-discovery/components/marketer-avatar";
import { formatYears } from "@/features/marketer-discovery/format";
import { formatOfferPrice } from "../format";
import { JobOfferDetails } from "@/features/jobs/components/job-offer-details";
import type { JobOfferComparison } from "@/features/jobs/types";
import "../offers.css";

export type JobOfferCardProps = {
  comparison: JobOfferComparison;
  canAccept?: boolean;
  pending?: boolean;
  onAccept?: (offer: JobOfferComparison, trigger: HTMLElement) => void;
};

export function formatOfferDate(dateString: string | null | undefined, timeZone = "UTC"): string {
  if (!dateString) return "Not specified";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone,
  });
}

export function JobOfferCard({
  comparison,
  canAccept = false,
  pending = false,
  onAccept,
}: JobOfferCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsTrigger = useRef<HTMLButtonElement>(null);
  const { marketer, rating, offered_price, delivery_date, message, offer_status, created_at } =
    comparison;
  const isRated = rating.is_rated && rating.average_rating !== null;
  return (
    <article
      data-testid={`job-offer-card-${comparison.offer_id}`}
      className="jo-card"
      aria-label={`Offer from ${marketer.name}`}
    >
      <div className="jo-card-header">
        <div className="jo-identity">
          <MarketerAvatar name={marketer.name} size="sm" />
          <div className="min-w-0">
            <h2>{marketer.name}</h2>
            <div className="jo-rating jo-muted">
              {isRated ? (
                <>
                  <Star aria-hidden="true" />
                  <strong>{rating.average_rating!.toFixed(1)}</strong>
                  <span>
                    ({rating.review_count} {rating.review_count === 1 ? "review" : "reviews"})
                  </span>
                </>
              ) : (
                <span data-testid="unrated-badge">No ratings yet</span>
              )}
              <span>· {formatYears(marketer.experience_years)}</span>
            </div>
          </div>
        </div>
        <StatusText status={offer_status} />
      </div>
      <dl className="jo-terms">
        <div>
          <dt>Offered price</dt>
          <dd className="jo-price">{formatOfferPrice(offered_price)}</dd>
        </div>
        <div>
          <dt>Delivery date</dt>
          <dd>{formatOfferDate(delivery_date)}</dd>
        </div>
      </dl>
      {message && <p className="jo-message">{message}</p>}
      <p className="jo-submitted jo-muted">
        Submitted on {formatOfferDate(created_at, "Asia/Bangkok")}
      </p>
      <div className="jo-card-actions">
        <Button
          ref={detailsTrigger}
          variant="outline"
          className="jo-secondary"
          disabled={pending}
          onClick={() => setDetailsOpen(true)}
          aria-haspopup="dialog"
          aria-label={`View details for ${marketer.name}`}
        >
          View details
        </Button>
        {canAccept && offer_status === "Pending" && onAccept && (
          <Button
            className="jo-primary"
            disabled={pending}
            aria-label={`Accept offer from ${marketer.name}`}
            onClick={(event) => onAccept(comparison, event.currentTarget)}
          >
            Accept offer
          </Button>
        )}
      </div>
      {detailsOpen && (
        <JobOfferDetails
          comparison={comparison}
          onClose={() => setDetailsOpen(false)}
          finalFocus={() => detailsTrigger.current}
        />
      )}
    </article>
  );
}
