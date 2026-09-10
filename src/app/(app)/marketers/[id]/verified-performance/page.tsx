import { notFound } from "next/navigation";
import { CheckSquare, SquareCheckBig, UserRound } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { InlineError } from "@/components/feedback/inline-error";
import { getMarketer } from "@/features/marketer-discovery/api";
import { MarketerDetailShell } from "@/features/marketer-discovery/components/marketer-detail-shell";
import { MarketerRating } from "@/features/marketer-discovery/components/marketer-rating";
import { MarketerReviewCard } from "@/features/marketer-discovery/components/marketer-review-card";
import { MarketerStatTile } from "@/features/marketer-discovery/components/marketer-stat-tile";
import { formatCount } from "@/features/marketer-discovery/format";
import {
  buildMarketerHrefFromRef,
  type RawSearchParams,
} from "@/features/marketer-discovery/schemas";
import { getDisplayError } from "@/lib/api/errors";

export default async function VerifiedPerformancePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const { id } = await params;
  const marketerID = Number(id);
  if (!Number.isSafeInteger(marketerID) || marketerID < 1) {
    return <InlineError title="Invalid marketer" message="The marketer ID is not valid." />;
  }

  const { ref } = await searchParams;

  let marketer;
  try {
    marketer = await getMarketer(marketerID);
  } catch (error) {
    return <InlineError message={getDisplayError(error)} />;
  }
  if (!marketer) notFound();

  const { performance, reviews } = marketer;
  const statValue = (value: number | null) => (
    <span className="text-2xl font-medium text-foreground">{formatCount(value)}</span>
  );

  return (
    <MarketerDetailShell
      title="Verified Performance"
      subtitle="Review, Rating and Complete job"
      backHref={buildMarketerHrefFromRef(marketerID, ref)}
    >
      <div className="grid grid-cols-2 gap-3">
        <MarketerStatTile
          label="Total complete jobs"
          icon={<CheckSquare className="size-6 shrink-0 text-brand" aria-hidden="true" />}
          value={statValue(performance.completed_jobs)}
        />
        <MarketerStatTile
          label="Total In-progress jobs"
          icon={<SquareCheckBig className="size-6 shrink-0 text-accent-teal" aria-hidden="true" />}
          value={statValue(performance.in_progress_jobs)}
        />
        <MarketerStatTile
          label="Average Rating"
          icon={null}
          value={<MarketerRating value={performance.average_rating} variant="stat" />}
        />
        <MarketerStatTile
          label="Ratings received"
          icon={<UserRound className="size-6 shrink-0 text-brand" aria-hidden="true" />}
          value={statValue(performance.rating_count)}
        />
      </div>

      <h2 className="mt-8 mb-3 text-base font-medium text-foreground">Latest Reviews</h2>
      {reviews.length === 0 ? (
        <EmptyState
          title="No ratings yet"
          description="This marketer has no reviews from completed jobs yet. Ratings appear here once a job is finished and reviewed."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {reviews.map((review) => (
            <MarketerReviewCard key={review.review_id} review={review} />
          ))}
        </ul>
      )}
    </MarketerDetailShell>
  );
}
