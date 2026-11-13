import { formatDate } from "@/features/job-invitations/format";
import { MarketerAvatar } from "@/features/marketer-discovery/components/marketer-avatar";
import { RatingStars } from "@/features/marketer-discovery/components/rating-stars";
import { reviewComment } from "@/features/marketer-discovery/reviews";
import type { MarketerReview } from "@/features/marketer-discovery/types";

type MarketerReviewCardProps = {
  review: MarketerReview;
};

const textClass = "whitespace-pre-wrap wrap-anywhere";

/** One verified review: rating, optional comment, date and the job it came from. */
export function MarketerReviewCard({ review }: MarketerReviewCardProps) {
  const comment = review.comment ? reviewComment(review.comment) : null;

  return (
    <li className="rounded-xl bg-background p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 items-center gap-3">
          {review.reviewer_name ? <MarketerAvatar name={review.reviewer_name} size="sm" /> : null}
          <div className="min-w-0">
            {review.reviewer_name ? (
              <p className="text-sm font-medium text-foreground wrap-anywhere">
                {review.reviewer_name}
              </p>
            ) : null}
            <time dateTime={review.created_at} className="text-xs text-muted-strong">
              {formatDate(review.created_at)}
            </time>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full bg-brand-subtle px-2 py-0.5 text-xs font-medium text-brand">
          Verified<span className="sr-only"> review from a completed job</span>
        </span>
      </div>

      <span role="img" aria-label={`${review.rating} out of 5 stars`} className="mt-3 inline-flex">
        <RatingStars value={review.rating} />
      </span>

      {comment === null ? (
        <p className="mt-2 text-sm text-muted-strong">No written feedback.</p>
      ) : comment.preview === null ? (
        <p className={`mt-2 text-sm text-foreground ${textClass}`}>{comment.text}</p>
      ) : (
        <div className="mt-2 text-sm text-foreground [&:has(details[open])>p]:hidden">
          <p className={textClass}>{comment.preview}</p>
          <details className="group mt-1">
            <summary className="cursor-pointer text-sm font-medium text-muted-strong underline underline-offset-2 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
              <span className="group-open:hidden">Read full review</span>
              <span className="hidden group-open:inline">Show less</span>
            </summary>
            <p className={`mt-2 ${textClass}`}>{comment.text}</p>
          </details>
        </div>
      )}

      <p className="mt-3 text-xs text-muted-strong">Job #{review.job_id}</p>
    </li>
  );
}
