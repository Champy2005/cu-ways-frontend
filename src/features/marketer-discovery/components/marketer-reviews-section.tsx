import Link from "next/link";

import { getMarketerReviews } from "@/features/marketer-discovery/api";
import { MarketerReviewCard } from "@/features/marketer-discovery/components/marketer-review-card";
import { MarketerReviewSummary } from "@/features/marketer-discovery/components/marketer-review-summary";
import {
  RetryReviewsButton,
  ReviewRatingFilter,
} from "@/features/marketer-discovery/components/reviews-controls";
import {
  filterReviews,
  paginateReviews,
  ratingDistribution,
  reviewsHref,
  type RatingFilter,
} from "@/features/marketer-discovery/reviews";
import type { MarketerReview } from "@/features/marketer-discovery/types";
import { ApiError } from "@/lib/api/errors";

type MarketerReviewsSectionProps = {
  marketerID: number;
  rating: RatingFilter;
  page: number;
  refValue: string;
};

const noticeClass = "rounded-2xl bg-background/30 p-4 shadow-card";
const linkClass =
  "inline-flex min-h-12 items-center text-sm font-medium text-muted-strong underline underline-offset-2 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50";

export function ReviewsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading reviews"
      className="mt-8 space-y-3 motion-safe:animate-pulse"
    >
      <div className="h-6 w-40 rounded bg-faint" />
      <div className="h-40 rounded-2xl bg-faint" />
      <div className="h-28 rounded-xl bg-faint" />
    </div>
  );
}

function ReviewsNotice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8" aria-labelledby="reviews-heading">
      <h2 id="reviews-heading" tabIndex={-1} className="mb-3 text-base font-medium text-foreground">
        Verified reviews
      </h2>
      <div className={noticeClass} role="alert">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        {children}
      </div>
    </section>
  );
}

function ReviewsFailure({ error }: { error: unknown }) {
  const status = error instanceof ApiError ? error.status : 0;
  if (status === 403 || status === 404) {
    return (
      <ReviewsNotice title="Profile unavailable">
        <p className="mt-1 text-sm text-muted-strong">This profile is not available.</p>
      </ReviewsNotice>
    );
  }
  const expired = status === 401;
  return (
    <ReviewsNotice title="Reviews could not load">
      <p className="mt-1 text-sm text-muted-strong">
        {expired
          ? "Your session expired. Sign in again to continue."
          : "Try again to load ratings and reviews."}
      </p>
      <div className="mt-3">
        {expired ? (
          <Link href="/login" className={linkClass}>
            Sign in
          </Link>
        ) : (
          <RetryReviewsButton />
        )}
      </div>
    </ReviewsNotice>
  );
}

function ReviewPager({
  page,
  pages,
  hrefFor,
}: {
  page: number;
  pages: number;
  hrefFor: (target: number) => string;
}) {
  if (pages < 2) return null;
  const spacer = <span aria-hidden="true" className="min-w-16" />;
  return (
    <nav aria-label="Review pages" className="mt-4 flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={linkClass}>
          Previous
        </Link>
      ) : (
        spacer
      )}
      <span className="text-sm text-muted-strong">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link href={hrefFor(page + 1)} className={linkClass}>
          Next
        </Link>
      ) : (
        spacer
      )}
    </nav>
  );
}

function ReviewList({
  reviews,
  items,
  marketerID,
  refValue,
}: {
  reviews: MarketerReview[];
  /** The reviews on the current page; empty means the chosen rating has none. */
  items: MarketerReview[];
  marketerID: number;
  refValue: string;
}) {
  if (reviews.length === 0) {
    return (
      <div className={`mt-3 ${noticeClass}`}>
        <h3 className="text-sm font-medium text-foreground">No reviews yet</h3>
        <p className="mt-1 text-sm text-muted-strong">Completed-job reviews will appear here.</p>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className={`mt-3 ${noticeClass}`}>
        <h3 className="text-sm font-medium text-foreground">No reviews match this rating</h3>
        <Link
          href={reviewsHref(marketerID, { rating: "all", page: 1 }, refValue)}
          className={linkClass}
        >
          Show all ratings
        </Link>
      </div>
    );
  }
  return (
    <ul className="mt-3 flex flex-col gap-3">
      {items.map((review) => (
        <MarketerReviewCard key={review.review_id} review={review} />
      ))}
    </ul>
  );
}

/** Verified reviews of one marketer: summary, rating filter, cards and paging. */
export async function MarketerReviewsSection({
  marketerID,
  rating,
  page,
  refValue,
}: MarketerReviewsSectionProps) {
  let history;
  try {
    history = await getMarketerReviews(marketerID);
  } catch (error) {
    return <ReviewsFailure error={error} />;
  }

  const { reviews, average_rating, review_count, truncated } = history;
  const matching = filterReviews(reviews, rating);
  const current = paginateReviews(matching, page);
  const hrefFor = (target: number) => reviewsHref(marketerID, { rating, page: target }, refValue);

  return (
    <section className="mt-8" aria-labelledby="reviews-heading">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            id="reviews-heading"
            tabIndex={-1}
            className="text-base font-medium text-foreground outline-none"
          >
            Verified reviews
          </h2>
          {rating !== "all" ? (
            <p className="text-xs text-muted-strong">
              {matching.length} of {reviews.length} reviews
            </p>
          ) : null}
        </div>
        {reviews.length > 0 ? (
          <ReviewRatingFilter marketerID={marketerID} rating={rating} refValue={refValue} />
        ) : null}
      </div>

      <MarketerReviewSummary
        average={average_rating}
        count={review_count}
        distribution={ratingDistribution(reviews)}
      />
      {truncated ? (
        <p className="mt-2 text-xs text-muted-strong">
          Showing the latest {reviews.length.toLocaleString("en-US")} reviews.
        </p>
      ) : null}

      <ReviewList
        reviews={reviews}
        items={current.items}
        marketerID={marketerID}
        refValue={refValue}
      />
      <ReviewPager page={current.page} pages={current.pages} hrefFor={hrefFor} />
    </section>
  );
}
