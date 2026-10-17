import Link from "next/link";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Users } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { CreatorJobSummary } from "@/features/jobs/types";

export type CreatorOffersJobPickerProps = {
  state: { status: "success"; items: CreatorJobSummary[] } | { status: "error"; message: string };
};

function JobOfferCardRow({ job }: { job: CreatorJobSummary }) {
  const surveyNames = job.surveys.map((survey) => survey.title);

  return (
    <li>
      <Link
        href={`/creator/jobs/${job.job_id}/offers`}
        className="group flex h-full flex-col justify-between rounded-2xl border border-[var(--mk-border)] bg-[var(--mk-surface)] p-5 shadow-[var(--mk-shadow)] outline-none transition-colors hover:border-[var(--mk-accent)] focus-visible:ring-3 focus-visible:ring-ring/50 sm:p-6"
        aria-label={`Compare offers for job ${job.job_id}, ${job.job_status}`}
      >
        <div>
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--mk-accent-soft)] text-[var(--mk-accent)]">
                <BriefcaseBusiness aria-hidden="true" className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-[var(--mk-text)]">Job #{job.job_id}</p>
                <p className="mt-1 text-sm text-[var(--mk-muted)]">
                  {surveyNames.length > 0 ? surveyNames.join(", ") : "No linked surveys"}
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-full border border-[var(--mk-border)] bg-[var(--mk-field)] px-2.5 py-1 text-xs font-medium text-[var(--mk-text)]">
              {job.job_status}
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-[var(--mk-border)] pt-4">
          <span className="text-xs text-[var(--mk-muted)]">Compare bids & ratings</span>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--mk-accent)]">
            Review offers
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </Link>
    </li>
  );
}

export function CreatorOffersJobPicker({ state }: CreatorOffersJobPickerProps) {
  return (
    <section className="mx-auto w-full max-w-5xl text-[var(--mk-text)]">
      <Link
        href="/creator/dashboard"
        aria-label="Back to Creator workspace"
        className="mb-5 inline-flex size-10 items-center justify-center rounded-full border border-[var(--mk-border)] bg-[var(--mk-surface)] text-[var(--mk-text)] shadow-[var(--mk-shadow)] outline-none hover:border-[var(--mk-accent)] focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowLeft aria-hidden="true" className="size-5" />
      </Link>

      <div className="mb-5 border-b border-[var(--mk-border)] pb-5">
        <h1 className="text-xl font-semibold tracking-tight">Compare Job Offers</h1>
        <p className="mt-1 text-sm text-[var(--mk-muted)]">
          Select one of your existing jobs to review and compare offers submitted by marketers.
        </p>
      </div>

      <section aria-labelledby="creator-jobs-heading" className="space-y-4">
        <div>
          <h2 id="creator-jobs-heading" className="text-lg font-semibold">
            Your active jobs
          </h2>
          <p className="mt-1 text-sm text-[var(--mk-muted)]">
            Choose a job to compare marketer quotes, profiles, and historical ratings.
          </p>
        </div>

        {state.status === "error" ? (
          <div className="mk-error-notice rounded-xl p-4" role="alert">
            <p className="font-semibold">Your jobs could not be loaded</p>
            <p className="mt-1 text-sm">{state.message}</p>
            <a
              href="/creator/jobs/offers"
              className="mt-3 inline-flex text-sm font-semibold underline underline-offset-4"
            >
              Reload your jobs
            </a>
            <Link
              href="/creator/dashboard"
              className="mt-2 block text-sm font-semibold underline underline-offset-4"
            >
              Return to Creator workspace
            </Link>
          </div>
        ) : state.items.length === 0 ? (
          <Card className="mk-card mk-card-padding gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-[var(--mk-accent-soft)] text-[var(--mk-accent)]">
              <Users aria-hidden="true" className="size-5" />
            </div>
            <h3 className="font-semibold">No jobs available</h3>
            <p className="text-sm leading-6 text-[var(--mk-muted)]">
              There are no existing jobs available in your Creator account.
            </p>
            <Link
              href="/creator/dashboard"
              className="mk-secondary-button mt-2 inline-flex min-h-11 items-center justify-center self-start px-4 text-sm font-medium"
            >
              Return to Creator workspace
            </Link>
          </Card>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {state.items.map((job) => (
              <JobOfferCardRow key={job.job_id} job={job} />
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
