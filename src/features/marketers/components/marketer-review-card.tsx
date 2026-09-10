import { MarketerAvatar } from "@/features/marketers/components/marketer-avatar";
import { RatingStars } from "@/features/marketers/components/rating-stars";
import type { MarketerReview } from "@/features/marketers/types";

type MarketerReviewCardProps = {
  review: MarketerReview;
};

export function MarketerReviewCard({ review }: MarketerReviewCardProps) {
  return (
    <li className="flex items-center gap-3 rounded-xl bg-background p-4 shadow-card">
      <MarketerAvatar name={review.reviewer_name} size="sm" />
      <div className="min-w-0">
        <RatingStars value={review.rating} />
        <p className="mt-0.5 text-sm font-medium text-foreground">{review.comment}</p>
        <p className="mt-0.5 truncate text-xs">
          <span className="font-medium text-brand">Creator</span>{" "}
          <span className="text-muted-strong">{review.reviewer_name}</span>
        </p>
      </div>
    </li>
  );
}
