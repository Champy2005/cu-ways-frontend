import Link from "next/link";
import { Briefcase, ClipboardList, Search, UserPlus, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MarketerIdentity } from "@/features/marketers/components/marketer-identity";
import type { CreatorJobSummary } from "@/features/jobs/types";

const links = [
  { href: "/surveys", label: "Manage surveys", icon: ClipboardList },
  { href: "/creator/jobs", label: "My jobs", icon: Layers },
  { href: "/creator/discovery", label: "Discover marketers", icon: Search },
  { href: "/creator/jobs/invite", label: "Invite marketers", icon: UserPlus },
  { href: "/creator/jobs/offers", label: "Compare job offers", icon: Briefcase },
];

export function CreatorOverview({
  name,
  jobs = null,
}: {
  name: string;
  jobs?: CreatorJobSummary[] | null;
}) {
  const attention = jobs?.filter(
    (job) =>
      (job.pending_offer_count ?? 0) > 0 ||
      job.job_status === "Accepted" ||
      job.job_status === "In Progress",
  );
  return (
    <div className="text-[var(--mk-text)]">
      <div className="mk-page-heading">
        <p className="mk-eyebrow">Your creator workspace</p>
        <h1 className="mk-page-title">Overview</h1>
        <p className="mk-page-description">Find the right marketers for your next project.</p>
      </div>
      <div className="mk-overview">
        <div className="mk-overview-recent">
          <MarketerIdentity
            name={name}
            roleLabel="Creator"
            mascotSrc="/marketer-assets/mascot-pink.svg"
            tone="pink"
          />
        </div>
        <section aria-labelledby="creator-workspace">
          <h2 id="creator-workspace" className="mk-section-title">
            Workspace
          </h2>
          <Card className="mk-card mk-card-padding gap-2">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex min-h-12 items-center gap-3 rounded-lg px-3 font-medium hover:bg-[var(--mk-hover)]"
              >
                <Icon aria-hidden="true" className="size-5 text-[var(--mk-accent)]" />
                {label}
              </Link>
            ))}
          </Card>
        </section>
        <section aria-labelledby="creator-actions">
          <h2 id="creator-actions" className="mk-section-title">
            Jobs needing attention
          </h2>
          <Card className="mk-card mk-card-padding gap-2">
            {attention === undefined ? (
              <p>
                Jobs are temporarily unavailable.{" "}
                <Link href="/creator/jobs" className="underline">
                  Try again
                </Link>
              </p>
            ) : attention.length === 0 ? (
              <p>No jobs need your attention right now.</p>
            ) : (
              attention.map((job) => (
                <Link
                  key={job.job_id}
                  href={`/creator/jobs/${job.job_id}`}
                  className="block rounded-lg px-3 py-3 hover:bg-[var(--mk-hover)]"
                >
                  <strong>{job.title || `Job #${job.job_id}`}</strong>
                  <span className="mt-1 block text-sm text-[var(--mk-muted)]">
                    {(job.pending_offer_count ?? 0) > 0
                      ? `${job.pending_offer_count} offer(s) to review`
                      : job.job_status === "Accepted"
                        ? "Marketer hired · check payment"
                        : "In progress · check payment and delivery"}
                  </span>
                </Link>
              ))
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
