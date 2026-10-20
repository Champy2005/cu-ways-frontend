"use client";

import Link from "next/link";
import { Check, ChevronLeft, Circle, Clock3, Smile } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  JobSuccessNotification,
  type JobSuccessNotice,
} from "@/features/jobs/components/job-success-notification";
import type { CreatorJobSummary } from "@/features/jobs/types";
import { cn } from "@/lib/utils";

export type JobCreatedDetails = {
  id?: number;
  createdAt: string;
  title: string;
  description?: string;
  compensation: string;
  deadline: string;
  surveyCount: number;
  status: CreatorJobSummary["job_status"];
};

const JOB_STATUS_SUBTITLES: Record<CreatorJobSummary["job_status"], string> = {
  Pending: "Awaiting offers for this job",
  Accepted: "Offer accepted for this job",
  "In Progress": "Work is currently in progress",
  Completed: "Job completed",
  Cancelled: "Job cancelled",
};

function JobStatusTracking({
  surveyCount,
  offerAccepted,
}: {
  surveyCount: number;
  offerAccepted: boolean;
}) {
  const steps = offerAccepted
    ? [
        { title: "Job created", description: "All required details completed", state: "complete" },
        {
          title: "Offer accepted",
          description: "A marketer has been selected. Work can start next.",
          state: "current",
        },
        { title: "In Progress", description: "Work has not started yet", state: "upcoming" },
      ]
    : [
        {
          title: "Job created",
          description: `Job details and ${surveyCount} ${surveyCount === 1 ? "survey" : "surveys"} saved`,
          state: "complete",
        },
        {
          title: "Awaiting offers",
          description: "Invite marketers to submit offers",
          state: "current",
        },
        {
          title: "Offer accepted",
          description: "Select a marketer to begin work",
          state: "upcoming",
        },
      ];

  return (
    <Card
      role="region"
      aria-labelledby="job-status-heading"
      className="gap-0 rounded-2xl border border-[var(--mk-border)] bg-[var(--mk-field)] p-4 text-[var(--mk-text)] shadow-card ring-0"
    >
      <h2 id="job-status-heading" className="text-base leading-5 font-bold">
        Status tracking
      </h2>
      <p className="mt-0.5 text-[11px] text-[var(--mk-muted)]">Current job progress</p>

      <ol className="mt-2.5">
        {steps.map((step, index) => (
          <li
            key={step.title}
            aria-current={step.state === "current" ? "step" : undefined}
            className={cn(
              "relative flex gap-3",
              index < steps.length - 1 && "pb-4",
              step.state === "upcoming" && "text-[var(--mk-muted)]",
            )}
          >
            {step.state === "upcoming" ? (
              <Circle aria-hidden="true" className="size-[18px] shrink-0" />
            ) : (
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-[18px] shrink-0 items-center justify-center rounded-full text-white",
                  step.state === "complete" ? "bg-[var(--mk-success)]" : "bg-[var(--mk-action)]",
                )}
              >
                {step.state === "complete" ? (
                  <Check className="size-3" strokeWidth={3} />
                ) : (
                  <span className="size-1.5 rounded-full bg-white" />
                )}
              </span>
            )}
            {index < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-6 bottom-1 left-2 w-px",
                  step.state === "complete" ? "bg-[var(--mk-success)]" : "bg-[var(--mk-border)]",
                )}
              />
            )}
            <div>
              <p className="text-xs leading-4 font-bold">{step.title}</p>
              <p className="mt-0.5 text-[11px] leading-4 text-[var(--mk-muted)]">
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function JobDeadline({ value }: { value: string }) {
  if (!value) return <>-</>;
  const formatted = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
  return <time dateTime={value}>{formatted}</time>;
}

export function JobCreatedView({
  job,
  onEdit,
  canEdit = true,
  notification,
  onDismissNotification,
}: {
  job: JobCreatedDetails;
  onEdit: () => void;
  canEdit?: boolean;
  notification?: JobSuccessNotice | null;
  onDismissNotification?: () => void;
}) {
  const offerAccepted = job.status === "Accepted";
  const showOfferTracking = ["Pending", "Accepted"].includes(job.status);
  const creationYear = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(new Date(job.createdAt));

  return (
    <section aria-labelledby="job-created-heading" className="mx-auto w-full max-w-md">
      <header className="mb-7 flex items-center gap-1">
        <Link
          href="/creator/jobs"
          aria-label="Back to my jobs"
          className="-ml-2 inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-[var(--mk-text)] outline-none hover:bg-[var(--mk-hover)] focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </Link>
        <div>
          <h1
            id="job-created-heading"
            className="text-lg leading-6 font-bold text-[var(--mk-text)]"
          >
            Job details
          </h1>
          <p className="mt-0.5 text-xs text-[var(--mk-muted)]">
            {JOB_STATUS_SUBTITLES[job.status]}
          </p>
        </div>
      </header>

      <div className="space-y-4">
        <JobSuccessNotification notice={notification} onDismiss={onDismissNotification} />

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
          <h3 className="mt-3 min-w-0 text-lg leading-5 font-bold wrap-break-word">{job.title}</h3>
          <div className="mt-1 flex items-center justify-between gap-3">
            {job.id && (
              <p className="text-[11px] text-[var(--mk-muted)]">
                JOB-{creationYear}-{job.id}
              </p>
            )}
            <span
              className={cn(
                "ml-auto inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-xs leading-4 font-semibold",
                offerAccepted
                  ? "border-[var(--mk-positive)] bg-[var(--mk-positive-soft)] text-[var(--mk-positive)]"
                  : [
                      "border-[#d99015] bg-[#fff6d2] text-[#d99015]",
                      "[[data-theme=dark]_&]:border-[#f9c46a] [[data-theme=dark]_&]:bg-[#363636] [[data-theme=dark]_&]:text-[#f9c46a]",
                      "[@media(prefers-color-scheme:dark)]:[[data-theme=system]_&]:border-[#f9c46a] [@media(prefers-color-scheme:dark)]:[[data-theme=system]_&]:bg-[#363636] [@media(prefers-color-scheme:dark)]:[[data-theme=system]_&]:text-[#f9c46a]",
                    ],
              )}
            >
              {offerAccepted ? (
                <Smile aria-hidden="true" className="size-3" />
              ) : (
                <Clock3 aria-hidden="true" className="size-3" />
              )}
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
                <JobDeadline value={job.deadline} />
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

        {showOfferTracking ? (
          <JobStatusTracking surveyCount={job.surveyCount} offerAccepted={offerAccepted} />
        ) : (
          <p className="text-sm text-[var(--mk-muted)]">Current status: {job.status}</p>
        )}

        {job.description && (
          <Card className="mk-card p-4">
            <h2 className="text-sm font-bold">Description</h2>
            <p className="text-sm whitespace-pre-wrap break-words text-[var(--mk-muted)]">
              {job.description}
            </p>
          </Card>
        )}
        <div className="grid grid-cols-2 gap-3">
          {canEdit && (
            <Button
              type="button"
              variant="outline"
              onClick={onEdit}
              className="mk-secondary-button h-11"
            >
              Edit
            </Button>
          )}
          {job.id && (
            <Link
              href={`/creator/jobs/${job.id}/offers`}
              className="mk-primary-button inline-flex h-11 items-center justify-center text-sm font-bold"
            >
              View offers
            </Link>
          )}
          {job.id && job.status === "Pending" && (
            <Link
              href={`/creator/jobs/${job.id}/invite`}
              className="mk-secondary-button col-span-2 inline-flex h-11 items-center justify-center text-sm font-bold"
            >
              Invite marketers
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
