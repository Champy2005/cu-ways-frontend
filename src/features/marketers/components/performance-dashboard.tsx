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

const cardClassName =
  "min-w-0 rounded-[18px] border border-[var(--mk-border)]/50 bg-[var(--mk-surface)] p-4 shadow-sm sm:p-5";

function PerformanceStats({ stats }: { stats: MarketerStats }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      <div className={cn(cardClassName, "col-span-2 sm:col-span-1")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <dt className="text-sm text-[var(--mk-muted)]">Total earnings</dt>
          <span className="inline-flex items-center gap-1 text-[11px] text-[var(--mk-muted)]">
            <Eye aria-hidden="true" className="size-3" /> Only visible to you
          </span>
        </div>
        <dd className="mt-3 flex items-baseline gap-2 text-2xl font-medium tabular-nums">
          <span aria-hidden="true" className="text-3xl text-[var(--mk-success)]">
            ฿
          </span>
          <span className="min-w-0 wrap-anywhere">{formatBahtAmount(stats.total_earnings)}</span>
          <span className="sr-only">Thai baht</span>
        </dd>
      </div>
      <div className={cardClassName}>
        <dt className="text-sm text-[var(--mk-muted)]">Completed jobs</dt>
        <dd className="mt-3 flex items-center gap-2 text-2xl font-medium tabular-nums">
          <CheckSquare2 aria-hidden="true" className="size-6 shrink-0 text-[var(--mk-accent)]" />
          <span className="min-w-0 wrap-anywhere">
            {stats.total_jobs_completed.toLocaleString("en-TH")}
          </span>
        </dd>
      </div>
      <div className={cardClassName}>
        <dt className="text-sm text-[var(--mk-muted)]">Average rating</dt>
        <dd className="mt-3 flex flex-wrap items-center gap-1.5 text-2xl font-medium tabular-nums">
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
    <section aria-labelledby="marketer-recent-jobs" className="mt-7">
      <h2 id="marketer-recent-jobs" className="mb-3 text-xl font-medium">
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
        <ul className="space-y-3">
          {jobs.map((job) => (
            <li
              key={job.id}
              className={cn(cardClassName, "flex items-center justify-between gap-3")}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium wrap-anywhere">{job.title}</p>
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
    <div className="mx-auto max-w-4xl space-y-7 text-[var(--mk-text)]">
      <h1 className="sr-only">Marketer dashboard</h1>
      <MarketerIdentity name={profile.name} />
      <section aria-labelledby="marketer-quickview">
        <h2 id="marketer-quickview" className="mb-3 text-xl font-medium">
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
  );
}
