"use client";

import { Star } from "lucide-react";
import { StatusText } from "@/components/ui/status-text";
import { bangkokDateTime } from "../format";
import { ratingLabel, type SavedReview, type StarRating } from "../review";
import { ConfirmSaveDialog } from "./confirm-save-dialog";
import { BackToJobLink } from "./record-page-parts";
import "../review.css";

/** A comment rendered as text (React escapes it), keeping line breaks. */
function ReviewComment({ comment, className }: { comment: string | null; className?: string }) {
  if (!comment) return <p className="pay-help">No written comment.</p>;
  return <p className={`review-comment ${className ?? ""}`}>{comment}</p>;
}

/** Read-only review the backend holds for this job. There is no edit or delete in this scope. */
export function ReviewSavedView({
  jobId,
  review,
  marketerName,
  notice,
}: {
  jobId: number;
  review: SavedReview;
  marketerName: string;
  notice?: string;
}) {
  return (
    <section className="pay-card" aria-labelledby="review-saved-heading">
      <div className="flex items-center justify-between gap-3">
        <h2 id="review-saved-heading" className="pay-section-title">
          Review submitted
        </h2>
        <StatusText status="Completed">Submitted</StatusText>
      </div>
      <p className="pay-help">
        For {marketerName} on{" "}
        <time dateTime={review.created_at}>{bangkokDateTime(review.created_at)}</time>
      </p>
      {notice && <p className="mt-2 text-sm text-[var(--mk-muted)]">{notice}</p>}
      <div className="review-saved-stars" role="img" aria-label={ratingLabel(review.rating)}>
        {Array.from({ length: review.rating }, (_, index) => (
          <Star key={index} aria-hidden="true" />
        ))}
      </div>
      <p className="mt-1 text-sm font-semibold" aria-hidden="true">
        {review.rating} out of 5
      </p>
      <div className="mt-3">
        <ReviewComment comment={review.comment} />
      </div>
      <p className="pay-help mt-4 border-t border-[var(--mk-border)] pt-3">
        One review can be submitted for each completed job.
      </p>
      <BackToJobLink jobId={jobId} />
    </section>
  );
}

export function ReviewConfirmDialog({
  marketerName,
  rating,
  comment,
  ...dialog
}: {
  marketerName: string;
  rating: StarRating;
  comment: string | null;
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
  finalFocus: () => HTMLElement | null;
}) {
  return (
    <ConfirmSaveDialog
      {...dialog}
      title="Submit your review?"
      description="Your review will be shown on the Marketer's profile. One review can be submitted for this job."
      savingNote="Submitting the review."
      confirmLabel="Submit review"
      pendingLabel="Submitting…"
    >
      <dl className="pay-details">
        <div>
          <dt>Marketer</dt>
          <dd>{marketerName}</dd>
        </div>
        <div>
          <dt>Rating</dt>
          <dd>{ratingLabel(rating)}</dd>
        </div>
      </dl>
      <ReviewComment comment={comment} className="review-dialog-comment" />
    </ConfirmSaveDialog>
  );
}
