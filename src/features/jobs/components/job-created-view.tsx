"use client";

import Link from "next/link";
import { Check, ChevronLeft, Circle, CircleCheck, Clock3, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type JobCreatedDetails = {
  title: string;
  compensation: string;
  deadline: string;
  surveyCount: number;
  status: "Pending";
};

function JobStatusTracking({ surveyCount }: { surveyCount: number }) {
  return (
    <Card
      role="region"
      aria-labelledby="job-status-heading"
      className="gap-0 rounded-2xl border border-[var(--mk-border)] bg-[var(--mk-field)] p-4 text-[var(--mk-text)] shadow-card ring-0"
    >
      <h2 id="job-status-heading" className="text-base leading-5 font-bold">
        Status tracking
      </h2>
      <p className="mt-0.5 text-[11px] text-[var(--mk-muted)]">Last updated just now</p>

      <ol className="mt-2.5">
        <li className="relative flex gap-3 pb-4">
          <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--mk-success)] text-white">
            <Check aria-hidden="true" className="size-3" strokeWidth={3} />
          </span>
          <span
            aria-hidden="true"
            className="absolute top-6 bottom-1 left-2 w-px bg-[var(--mk-success)]"
          />
          <div>
            <p className="text-xs leading-4 font-bold">Job created</p>
            <p className="mt-0.5 text-[11px] leading-4 text-[var(--mk-muted)]">
              Job details and {surveyCount} {surveyCount === 1 ? "survey" : "surveys"} saved
            </p>
          </div>
        </li>
        <li aria-current="step" className="relative flex gap-3 pb-4">
          <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--mk-action)]">
            <span className="size-1.5 rounded-full bg-white" />
          </span>
          <span
            aria-hidden="true"
            className="absolute top-6 bottom-1 left-2 w-px bg-[var(--mk-border)]"
          />
          <div>
            <p className="text-xs leading-4 font-bold">Awaiting offers</p>
            <p className="mt-0.5 text-[11px] leading-4 text-[var(--mk-muted)]">
              Visible to marketers to submit offers
            </p>
          </div>
        </li>
        <li className="flex gap-3 text-[var(--mk-muted)]">
          <Circle aria-hidden="true" className="size-[18px] shrink-0" />
          <div>
            <p className="text-xs leading-4 font-bold">Offer accepted</p>
            <p className="mt-0.5 text-[11px] leading-4">Select a marketer to begin work</p>
          </div>
        </li>
      </ol>
    </Card>
  );
}

export function JobCreatedView({ job, onEdit }: { job: JobCreatedDetails; onEdit: () => void }) {
  const [showNotification, setShowNotification] = useState(true);
  const deadline = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${job.deadline}T00:00:00Z`));

  return (
    <section aria-labelledby="job-created-heading" className="mx-auto w-full max-w-md">
      <header className="mb-7 flex items-center gap-1">
        <Link
          href="/creator/dashboard"
          aria-label="Back to creator page"
          className="-ml-2 inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-[var(--mk-text)] outline-none hover:bg-[var(--mk-hover)] focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </Link>
        <div>
          <h1
            id="job-created-heading"
            className="text-lg leading-6 font-bold text-[var(--mk-text)]"
          >
            Job created
          </h1>
          <p className="mt-0.5 text-xs text-[var(--mk-muted)]">Saved to your jobs</p>
        </div>
      </header>

      <div className="space-y-4">
        {showNotification && (
          <div
            role="status"
            className="relative flex items-center gap-2.5 rounded-[14px] border border-[var(--mk-success)] bg-[var(--mk-positive-soft)] p-3 shadow-card"
          >
            <CircleCheck
              aria-hidden="true"
              className="size-[18px] shrink-0 text-[var(--mk-success)]"
            />
            <div className="min-w-0 flex-1 text-xs text-[var(--mk-text)]">
              <p className="pr-5 font-bold">Job created</p>
              <p className="mt-0.5 text-[11px] leading-4 text-[var(--mk-muted)]">
                Your job has been created with Pending status. Marketers can now view and submit
                offers.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Dismiss job created notification"
              onClick={() => setShowNotification(false)}
              className="absolute top-2 right-2 text-[var(--mk-muted)]"
            >
              <X aria-hidden="true" className="size-3" />
            </Button>
          </div>
        )}

        <Card
          role="region"
          aria-labelledby="job-overview-heading"
          className="gap-0 rounded-2xl border border-[var(--mk-border)] bg-[var(--mk-surface)] p-4 text-[var(--mk-text)] shadow-card ring-0"
        >
          <h2
            id="job-overview-heading"
            className="text-xs font-bold tracking-wide text-[var(--mk-muted)] uppercase"
          >
            Job overview
          </h2>
          <div className="mt-3 flex items-end justify-between gap-3">
            <h3 className="min-w-0 text-lg leading-5 font-bold wrap-break-word">{job.title}</h3>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-xs leading-4 font-semibold",
                "border-[#d99015] bg-[#fff6d2] text-[#d99015]",
                "[[data-theme=dark]_&]:border-[#f9c46a] [[data-theme=dark]_&]:bg-[#363636] [[data-theme=dark]_&]:text-[#f9c46a]",
                "[@media(prefers-color-scheme:dark)]:[[data-theme=system]_&]:border-[#f9c46a] [@media(prefers-color-scheme:dark)]:[[data-theme=system]_&]:bg-[#363636] [@media(prefers-color-scheme:dark)]:[[data-theme=system]_&]:text-[#f9c46a]",
              )}
            >
              <Clock3 aria-hidden="true" className="size-3" />
              {job.status}
            </span>
          </div>
          <dl className="mt-3 space-y-2.5 border-t border-[var(--mk-border)] pt-3 text-xs">
            <div className="flex items-start justify-between gap-4">
              <dt className="shrink-0 text-[var(--mk-muted)]">Compensation</dt>
              <dd className="min-w-0 text-right font-semibold wrap-break-word">
                {job.compensation}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-[var(--mk-muted)]">Deadline</dt>
              <dd className="text-right font-semibold">
                <time dateTime={job.deadline}>{deadline}</time>
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-[var(--mk-muted)]">Linked surveys</dt>
              <dd className="text-right font-semibold">
                {job.surveyCount} {job.surveyCount === 1 ? "survey" : "surveys"}
              </dd>
            </div>
          </dl>
        </Card>

        <JobStatusTracking surveyCount={job.surveyCount} />

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onEdit}
            className="h-11 rounded-[14px] border border-[var(--mk-border)] bg-[var(--mk-surface)] text-sm font-bold text-[var(--mk-text)] shadow-card hover:bg-[var(--mk-hover)]"
          >
            Edit
          </Button>
          <Button
            type="button"
            className="h-11 rounded-[14px] bg-[var(--mk-action)] text-sm font-bold text-white shadow-card hover:bg-[var(--mk-action-hover)]"
          >
            View Job
          </Button>
        </div>
      </div>
    </section>
  );
}
