import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CheckSquare, SquareCheckBig, UserRound } from "lucide-react";

import { InlineError } from "@/components/feedback/inline-error";
import { getMarketer } from "@/features/marketer-discovery/api";
import { MarketerDetailShell } from "@/features/marketer-discovery/components/marketer-detail-shell";
import { MarketerRating } from "@/features/marketer-discovery/components/marketer-rating";
import {
  MarketerReviewsSection,
  ReviewsSkeleton,
} from "@/features/marketer-discovery/components/marketer-reviews-section";
import { MarketerStatTile } from "@/features/marketer-discovery/components/marketer-stat-tile";
import { formatCount } from "@/features/marketer-discovery/format";
import { parseReviewParams } from "@/features/marketer-discovery/reviews";
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

  const { ref, ...query } = await searchParams;
  const { rating, page } = parseReviewParams(query);

  let marketer;
  try {
    marketer = await getMarketer(marketerID);
  } catch (error) {
    return <InlineError message={getDisplayError(error)} />;
  }
  if (!marketer) notFound();

  const { performance } = marketer;
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

      <Suspense fallback={<ReviewsSkeleton />}>
        <MarketerReviewsSection
          marketerID={marketerID}
          rating={rating}
          page={page}
          refValue={Array.isArray(ref) ? (ref[0] ?? "") : (ref ?? "")}
        />
      </Suspense>
    </MarketerDetailShell>
  );
}
