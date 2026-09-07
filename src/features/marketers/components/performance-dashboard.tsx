import { CheckSquare2, Eye, Star } from "lucide-react";

import { MarketerIdentity } from "@/features/marketers/components/marketer-identity";
import type { MarketerProfile, MarketerStats } from "@/features/marketers/types";
import { cn } from "@/lib/utils";
import { formatBahtAmount } from "@/features/marketers/format";

export type RecentJob = {
  id: number;
  title: string;
  date: string;
  status: "Completed" | "In Progress";
  price: string;
};

type PerformanceDashboardProps = {
  profile: MarketerProfile;
  stats: MarketerStats | null;
  statsError?: string;
  recentJobs?: RecentJob[];
};

const cardClassName = "mk-card mk-card-padding";

function PerformanceStats({ stats }: { stats: MarketerStats }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      <div className={cn(cardClassName, "mk-stat-card col-span-2 sm:col-span-1")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <dt className="mk-stat-label">Total earnings</dt>
          <span className="inline-flex items-center gap-1 text-[11px] text-[var(--mk-muted)]">
            <Eye aria-hidden="true" className="size-3" /> Only visible to you
          </span>
        </div>
        <dd className="mk-stat-value mt-4 flex items-baseline gap-2 tabular-nums">
          <span aria-hidden="true" className="text-3xl text-[var(--mk-success)]">
            ฿
          </span>
          <span className="min-w-0 wrap-anywhere">{formatBahtAmount(stats.total_earnings)}</span>
          <span className="sr-only">Thai baht</span>
        </dd>
      </div>
      <div className={cn(cardClassName, "mk-stat-card")}>
        <dt className="mk-stat-label">Completed jobs</dt>
        <dd className="mk-stat-value mt-4 flex items-center gap-2 tabular-nums">
          <CheckSquare2 aria-hidden="true" className="size-6 shrink-0 text-[var(--mk-accent)]" />
          <span className="min-w-0 wrap-anywhere">
            {stats.total_jobs_completed.toLocaleString("en-TH")}
          </span>
        </dd>
      </div>
      <div className={cn(cardClassName, "mk-stat-card")}>
        <dt className="mk-stat-label">Average rating</dt>
        <dd className="mk-stat-value mt-4 flex flex-wrap items-center gap-1.5 tabular-nums">
          <Star
            aria-hidden="true"
            className="size-6 fill-[var(--mk-accent)] text-[var(--mk-accent)]"
          />
          {stats.average_rating.toFixed(2)}
          <span className="text-xs font-normal text-[var(--mk-muted)]">/ 5.0</span>
        </dd>
        {stats.average_rating === 0 ? (
          <p className="mt-2 text-xs text-[var(--mk-muted)]">No ratings yet.</p>
        ) : null}
      </div>
    </dl>
  );
}

function RecentJobs({ jobs }: { jobs: RecentJob[] }) {
  return (
    <section aria-labelledby="marketer-recent-jobs" className="mk-overview-recent">
      <h2 id="marketer-recent-jobs" className="mk-section-title">
        Recent jobs
      </h2>
      {jobs.length === 0 ? (
        <div className={cardClassName}>
          <p className="text-sm font-medium">Recent jobs are not available yet.</p>
          <p className="mt-2 text-sm text-[var(--mk-muted)]">
            Your job history will appear here when it is connected.
          </p>
        </div>
      ) : (
        <ul className="mk-recent-jobs">
          {jobs.map((job) => (
            <li
              key={job.id}
              className={cn(cardClassName, "flex items-center justify-between gap-3")}
            >
              <div className="min-w-0">
                <p className="text-base font-medium wrap-anywhere">{job.title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="text-[var(--mk-muted)]">{job.date}</span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5",
                      job.status === "Completed"
                        ? "text-[var(--mk-success)]"
                        : "text-[var(--mk-info,#1877ac)]",
                    )}
                  >
                    <span aria-hidden="true" className="size-2 rounded-full bg-current" />
                    {job.status}
                  </span>
                </div>
              </div>
              <p className="max-w-[45%] text-right text-lg font-medium wrap-anywhere tabular-nums">
                ฿{formatBahtAmount(job.price)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Owner-only performance view. Never include private statistics in a viewer catalog. */
export function PerformanceDashboard({
  profile,
  stats,
  statsError,
  recentJobs = [],
}: PerformanceDashboardProps) {
  return (
    <div className="text-[var(--mk-text)]">
      <div className="mk-page-heading">
        <p className="mk-eyebrow">Your professional workspace</p>
        <h1 className="mk-page-title">Overview</h1>
        <p className="mk-page-description">A snapshot of your work, earnings, and impact.</p>
      </div>
      <div className="mk-overview">
        <MarketerIdentity name={profile.name} />
        <section aria-labelledby="marketer-quickview">
          <h2 id="marketer-quickview" className="mk-section-title">
            Quickview
          </h2>
          {stats ? (
            <PerformanceStats stats={stats} />
          ) : (
            <div role="status" className={cardClassName}>
              <p className="font-medium">Performance data is unavailable.</p>
              <p className="mt-2 text-sm text-[var(--mk-muted)]">
                {statsError ?? "Your performance summary will appear once it is available."}
              </p>
            </div>
          )}
        </section>
        <RecentJobs jobs={recentJobs} />
      </div>
    </div>
  );
}
