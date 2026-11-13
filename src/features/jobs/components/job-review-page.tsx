"use client";

import { useRef, useState, type FormEvent } from "react";
import { SuccessToast } from "@/components/feedback/success-toast";
import { Textarea } from "@/components/ui/textarea";
import type { JobReviewData } from "../api";
import { RATING_REQUIRED, normalizeComment, type SavedReview, type StarRating } from "../review";
import { checkJobReview, submitJobReview, type SubmitReviewResult } from "../review-actions";
import {
  FormAlert,
  JobSummaryCard,
  RecordNote,
  RecordPageHeader,
  RecordStatusUnknownView,
  RecordSubmitButton,
  RecordUnavailableCard,
} from "./record-page-parts";
import { ReviewConfirmDialog, ReviewSavedView } from "./review-views";
import { StarRatingInput } from "./star-rating-input";
import { useConfirmedSave } from "./use-confirmed-save";

type Outcome =
  | { kind: "form" }
  | { kind: "review"; review: SavedReview; notice?: string }
  | { kind: "unknown"; title: string; message: string }
  | { kind: "unavailable"; title: string; message: string };

const NOT_COMPLETED: Extract<Outcome, { kind: "unavailable" }> = {
  kind: "unavailable",
  title: "Complete the job first",
  message: "You can review the Marketer after the job is completed.",
};

/** A review the backend already holds always wins over showing the form again. */
function initialOutcome({ job, currentReview }: JobReviewData): Outcome {
  if (currentReview) return { kind: "review", review: currentReview };
  return job.job_status === "Completed" ? { kind: "form" } : NOT_COMPLETED;
}

export function JobReviewPage({ data }: { data: JobReviewData }) {
  const { job, acceptedOffer } = data;
  const marketerName = acceptedOffer?.marketer.name ?? "the Marketer";

  const firstStar = useRef<HTMLInputElement>(null);
  const save = useConfirmedSave<Outcome>(() => initialOutcome(data), firstStar);
  const { outcome, pending } = save;
  const [rating, setRating] = useState<StarRating | null>(null);
  const [comment, setComment] = useState("");
  const [ratingError, setRatingError] = useState<string | undefined>();
  const [toast, setToast] = useState<string | null>(null);

  const hasReview = outcome.kind === "review" || outcome.kind === "unknown";

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    save.setFormAlert(null);
    if (rating === null) {
      setRatingError(RATING_REQUIRED);
      return firstStar.current?.focus();
    }
    save.openDialog();
  }

  function applyResult(result: SubmitReviewResult) {
    switch (result.status) {
      case "submitted":
        save.settle({ kind: "review", review: result.review });
        setToast("Thank you for your feedback.");
        return;
      case "existing":
        save.settle({ kind: "review", review: result.review, notice: result.message });
        return;
      case "existing_unconfirmed":
        save.settle({
          kind: "unknown",
          title: "Review already submitted",
          message: result.message,
        });
        return;
      case "unknown":
        save.settle({ kind: "unknown", title: "Review status unknown", message: result.message });
        return;
      case "unavailable":
        save.settle({ ...NOT_COMPLETED, message: result.message });
        return;
      case "error":
        // Keep the rating and comment so the Creator can retry or go back.
        save.showError(result.message);
    }
  }

  function confirm() {
    if (rating === null) return;
    save.run(async () => {
      applyResult(await submitJobReview(job.job_id, rating, normalizeComment(comment)));
    });
  }

  function checkStatus() {
    save.run(async () => {
      const result = await checkJobReview(job.job_id);
      if (result.status === "found") {
        save.settle({ kind: "review", review: result.review });
      } else if (result.status === "none") {
        const completed = job.job_status === "Completed";
        save.settle(completed ? { kind: "form" } : NOT_COMPLETED);
        if (completed)
          save.setFormAlert("No review is saved for this job yet. You can submit it now.");
      } else {
        save.setOutcome((current) =>
          current.kind === "unknown" ? { ...current, message: result.message } : current,
        );
      }
    });
  }

  return (
    <section aria-labelledby="record-heading" className="mx-auto w-full max-w-md">
      <RecordPageHeader
        jobId={job.job_id}
        headingRef={save.heading}
        title={hasReview ? "Your review" : "Write a review"}
        subtitle="Share your experience with the Marketer."
      />

      <SuccessToast title="Review submitted" message={toast} onDismiss={() => setToast(null)} />

      <div className="space-y-4">
        <JobSummaryCard job={job} acceptedOffer={acceptedOffer} />

        {outcome.kind === "unavailable" && (
          <RecordUnavailableCard
            jobId={job.job_id}
            title={outcome.title}
            message={outcome.message}
            linkLabel="View job details"
          />
        )}
        {outcome.kind === "review" && (
          <ReviewSavedView
            jobId={job.job_id}
            review={outcome.review}
            marketerName={marketerName}
            notice={outcome.notice}
          />
        )}
        {outcome.kind === "unknown" && (
          <RecordStatusUnknownView
            jobId={job.job_id}
            title={outcome.title}
            message={outcome.message}
            checkLabel="Check review status"
            checking={pending}
            onCheck={checkStatus}
          />
        )}

        {outcome.kind === "form" && (
          <form className="pay-card space-y-6" noValidate onSubmit={review}>
            <div>
              <h2 className="pay-section-title">How was your experience?</h2>
              <p className="pay-help">Your review will appear on {marketerName}&apos;s profile.</p>
            </div>
            <FormAlert message={save.formAlert} />
            {pending && !save.confirming && (
              <RecordNote role="status">
                Still submitting this review. This page updates when it finishes, and it will not be
                submitted twice.
              </RecordNote>
            )}
            <StarRatingInput
              value={rating}
              error={ratingError}
              firstStarRef={firstStar}
              onChange={(next) => {
                setRating(next);
                setRatingError(undefined);
              }}
            />
            <div>
              <label htmlFor="review-comment" className="text-sm font-semibold">
                Comment <span className="font-normal text-[var(--mk-muted)]">(optional)</span>
              </label>
              <Textarea
                id="review-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="What went well? What could be better?"
                aria-describedby="review-comment-help"
                className="mt-2 border-[var(--mk-border)] bg-[var(--mk-field)] text-[var(--mk-text)]"
              />
              <p id="review-comment-help" className="pay-help">
                Share feedback about the work. Avoid personal or payment details.
              </p>
            </div>
            <RecordNote>
              You can submit one review for this job. Check your rating and comment before
              submitting.
            </RecordNote>
            <RecordSubmitButton
              buttonRef={save.submitButton}
              pending={pending}
              pendingLabel="Submitting…"
            >
              Review &amp; submit
            </RecordSubmitButton>
          </form>
        )}
      </div>

      {save.confirming && rating !== null && (
        <ReviewConfirmDialog
          marketerName={marketerName}
          rating={rating}
          comment={normalizeComment(comment)}
          pending={pending}
          error={save.dialogError}
          onConfirm={confirm}
          onClose={() => save.closeDialog()}
          finalFocus={save.finalFocus}
        />
      )}
    </section>
  );
}
