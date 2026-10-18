"use client";

import { useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogPopup,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { JobOfferComparison } from "@/features/jobs/types";
import { formatYears } from "@/features/marketer-discovery/format";

export function JobOfferDetails({
  comparison,
  onClose,
  finalFocus,
}: {
  comparison: JobOfferComparison;
  onClose: () => void;
  finalFocus: () => HTMLElement | null;
}) {
  const container = useRef<HTMLDivElement>(null);
  const { marketer, rating, message } = comparison;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <div ref={container} />
      <DialogPortal container={container}>
        <DialogOverlay className="mk-dialog-backdrop fixed inset-0 z-[60]" />
        <DialogPopup className="jo-modal mk-dialog-surface" finalFocus={finalFocus}>
          <div className="jo-modal-heading">
            <div>
              <DialogTitle className="jo-modal-title">{marketer.name}</DialogTitle>
              <DialogDescription className="jo-muted">
                Marketer details · {formatYears(marketer.experience_years)}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close marketer details"
              onClick={onClose}
            >
              <X aria-hidden="true" />
            </Button>
          </div>
          <div className="jo-details-body">
            {marketer.bio && (
              <section>
                <h3>About</h3>
                <p>{marketer.bio}</p>
              </section>
            )}
            <section>
              <h3>Availability</h3>
              <p>
                <span className="capitalize">{marketer.availability_status}</span>
                {marketer.availability_text ? ` · ${marketer.availability_text}` : ""}
              </p>
            </section>
            <section>
              <h3>Expertise</h3>
              <p>{marketer.expertise.map((item) => item.name).join(", ") || "Not specified"}</p>
            </section>
            <section>
              <h3>Campus coverage</h3>
              <p>{marketer.campuses.map((item) => item.name).join(", ") || "Not specified"}</p>
            </section>
            <section>
              <h3>Historical rating summary</h3>
              <dl className="jo-rating-summary">
                <div>
                  <dt>Average rating</dt>
                  <dd>
                    {rating.is_rated && rating.average_rating !== null
                      ? `${rating.average_rating.toFixed(1)} / 5`
                      : "No ratings yet"}
                  </dd>
                </div>
                <div>
                  <dt>Reviews</dt>
                  <dd>{rating.review_count}</dd>
                </div>
                <div>
                  <dt>Completed jobs</dt>
                  <dd>{rating.completed_jobs}</dd>
                </div>
              </dl>
            </section>
            <section>
              <h3>Contact information</h3>
              <dl className="jo-contact">
                <div>
                  <dt>Email</dt>
                  <dd>{marketer.email}</dd>
                </div>
                {marketer.phone && (
                  <div>
                    <dt>Phone</dt>
                    <dd>{marketer.phone}</dd>
                  </div>
                )}
                {marketer.line_id && (
                  <div>
                    <dt>Line ID</dt>
                    <dd>{marketer.line_id}</dd>
                  </div>
                )}
              </dl>
            </section>
            {message && (
              <section>
                <h3>Full offer message</h3>
                <p className="jo-full-message">{message}</p>
              </section>
            )}
          </div>
          <Button variant="outline" className="jo-secondary" onClick={onClose}>
            Close details
          </Button>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
