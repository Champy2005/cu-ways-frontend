import Link from "next/link";
import { Search } from "lucide-react";

import { Card } from "@/components/ui/card";
import { MarketerIdentity } from "@/features/marketers/components/marketer-identity";

export function CreatorOverview({ name }: { name: string }) {
  return (
    <div className="text-[var(--mk-text)]">
      <div className="mk-page-heading">
        <p className="mk-eyebrow">Your creator workspace</p>
        <h1 className="mk-page-title">Overview</h1>
        <p className="mk-page-description">Find the right marketers for your next project.</p>
      </div>
      <div className="mk-overview">
        <MarketerIdentity
          name={name}
          roleLabel="Creator"
          mascotSrc="/marketer-assets/mascot-pink.svg"
          tone="pink"
        />
        <section aria-labelledby="creator-discovery">
          <h2 id="creator-discovery" className="mk-section-title">
            Marketer discovery
          </h2>
          <Card className="mk-card mk-card-padding gap-0">
            <p className="text-sm text-[var(--mk-muted)]">
              Search marketers by expertise, campus, experience, price, and rating.
            </p>
            <Link
              href="/creator/discovery"
              className="mk-primary-button mt-5 inline-flex items-center justify-center gap-2 self-start text-sm font-medium"
            >
              <Search aria-hidden="true" className="size-4" />
              Discover marketers
            </Link>
          </Card>
        </section>
      </div>
    </div>
  );
}
