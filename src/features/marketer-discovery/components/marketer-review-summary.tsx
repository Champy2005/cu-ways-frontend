import type { RatingStar } from "@/features/marketer-discovery/reviews";

type MarketerReviewSummaryProps = {
  average: number | null;
  count: number;
  distribution: { star: RatingStar; count: number }[];
};

const cardClass = "rounded-2xl bg-background/30 p-4 shadow-card";
const barClass =
  "h-2 min-w-0 flex-1 appearance-none overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-faint [&::-webkit-progress-value]:bg-brand [&::-moz-progress-bar]:bg-brand";

/** Average, count and per-star bars. Unrated shows the empty state, never a zero. */
export function MarketerReviewSummary({
  average,
  count,
  distribution,
}: MarketerReviewSummaryProps) {
  if (average === null || count === 0) {
    return (
      <div className={cardClass}>
        <h3 className="text-sm font-medium text-foreground">No ratings yet</h3>
        <p className="mt-1 text-sm text-muted-strong">
          Ratings appear after the first completed-job review.
        </p>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <p className="flex items-baseline gap-1.5">
        <span className="text-3xl font-medium text-foreground">{average.toFixed(2)}</span>
        <span className="text-xs font-medium text-muted-strong">/ 5</span>
      </p>
      <p className="mt-1 text-sm text-muted-strong">
        {count.toLocaleString("en-US")} verified {count === 1 ? "review" : "reviews"}
      </p>
      <ul aria-label="Rating distribution" className="mt-4 space-y-2">
        {distribution.map(({ star, count: total }) => (
          <li key={star} className="flex items-center gap-3 text-xs text-muted-strong">
            <span className="w-8 shrink-0">
              {star}
              <span aria-hidden="true"> ★</span>
            </span>
            <progress
              max={count}
              value={total}
              aria-label={`${star} ${star === 1 ? "star" : "stars"}: ${total} ${total === 1 ? "review" : "reviews"}`}
              className={barClass}
            />
            <span className="w-8 shrink-0 text-right tabular-nums">{total}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
