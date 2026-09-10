import Image from "next/image";

import { MarketerAvatar } from "@/features/marketers/components/marketer-avatar";
import { VerifiedBadge } from "@/features/marketers/components/verified-badge";
import type { MarketerSummary } from "@/features/marketers/types";

type MarketerHeroCardProps = {
  marketer: MarketerSummary;
};

export function MarketerHeroCard({ marketer }: MarketerHeroCardProps) {
  return (
    <div className="relative flex items-center gap-4 overflow-hidden rounded-2xl bg-hero p-4 shadow-card">
      <MarketerAvatar
        name={marketer.display_name}
        size="lg"
        className="bg-hero-foreground/10 text-hero-foreground"
      />
      <div className="relative z-10 min-w-0">
        <p className="flex items-center gap-2 text-xl font-medium text-accent-teal">
          Marketer
          {marketer.is_verified ? <VerifiedBadge size={20} /> : null}
        </p>
        <p className="truncate text-base font-medium text-hero-foreground">
          {marketer.display_name}
        </p>
        <p className="truncate text-xl text-muted-foreground">{marketer.headline}</p>
      </div>
      <Image
        src="/marketers/marketer-hero-mark.svg"
        alt=""
        aria-hidden="true"
        width={73}
        height={70}
        className="pointer-events-none absolute -right-2 bottom-0 opacity-90"
      />
    </div>
  );
}
