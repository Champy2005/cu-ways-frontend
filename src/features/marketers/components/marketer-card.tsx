import Link from "next/link";

import { MarketerAvatar } from "@/features/marketers/components/marketer-avatar";
import { MarketerRating } from "@/features/marketers/components/marketer-rating";
import { VerifiedBadge } from "@/features/marketers/components/verified-badge";
import type { MarketerSummary } from "@/features/marketers/types";

type MarketerCardProps = {
  marketer: MarketerSummary;
  href: string;
};

export function MarketerCard({ marketer, href }: MarketerCardProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-xl bg-background p-4 shadow-card transition-shadow outline-none hover:shadow-lg focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <MarketerAvatar name={marketer.display_name} size="md" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-base font-medium text-accent-teal">
          Marketer
          {marketer.is_verified ? <VerifiedBadge /> : null}
        </p>
        <p className="truncate text-[13px] font-medium text-foreground">{marketer.display_name}</p>
        <p className="truncate text-base text-muted-foreground">{marketer.headline}</p>
      </div>
      <MarketerRating value={marketer.average_rating} className="self-end" />
    </Link>
  );
}
