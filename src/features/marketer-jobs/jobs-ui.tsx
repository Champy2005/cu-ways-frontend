"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CircleAlert,
  Info,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import type { ReactNode } from "react";
import type { JobFailure } from "./types";
import { useJobsWorkspace } from "./jobs-workspace";
import s from "./jobs.module.css";

export function JobsHeading({
  title,
  backHref,
  children,
}: {
  title: string;
  backHref?: string;
  children?: ReactNode;
}) {
  return (
    <header className={s.pageHeading}>
      <div className={s.headingCopy}>
        {backHref && (
          <Link href={backHref} className={s.back} aria-label="Back to My Jobs">
            <ArrowLeft size={20} aria-hidden="true" />
            <span>Back to My Jobs</span>
          </Link>
        )}
        <h1 id="jobs-heading" tabIndex={-1}>
          {title}
        </h1>
      </div>
      {children}
    </header>
  );
}

export function JobsNotice({
  title,
  children,
  action,
  tone = "info",
  busy = false,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  tone?: "info" | "warning" | "error";
  busy?: boolean;
}) {
  const Icon = busy ? LoaderCircle : tone === "info" ? Info : CircleAlert;
  return (
    <div className={s.notice} data-tone={tone} role={tone === "error" ? "alert" : "status"}>
      <Icon size={21} className={busy ? s.spinner : undefined} aria-hidden="true" />
      <div>
        <h2>{title}</h2>
        {children && <p>{children}</p>}
      </div>
      {action && <div className={s.noticeAction}>{action}</div>}
    </div>
  );
}

export function RefreshJobs({
  onClick,
  disabled = false,
  label = "Refresh job",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button type="button" className={s.utility} onClick={onClick} disabled={disabled}>
      <RefreshCw size={17} aria-hidden="true" />
      {label}
    </button>
  );
}

const failures: Record<JobFailure, { title: string; body: string }> = {
  expired: {
    title: "Session expired",
    body: "Your session expired. Sign in to check this job’s status.",
  },
  forbidden: {
    title: "Marketer access required",
    body: "Use an account with marketer access to view hired jobs.",
  },
  unavailable: {
    title: "Job unavailable",
    body: "This job couldn’t be found or you don’t have access to it.",
  },
  invalid: {
    title: "Job details need refreshing",
    body: "This job isn’t ready to start. Refresh its details or contact support.",
  },
  error: { title: "Job details couldn’t load", body: "Try again to load this job’s details." },
};

export function JobsFailure({
  status,
  returnTo,
  onRetry,
  list = false,
}: {
  status: JobFailure;
  returnTo: string;
  onRetry: () => void;
  list?: boolean;
}) {
  const copy = failures[status];
  return (
    <section className={s.empty} role="alert">
      <CircleAlert className={s.emptyIcon} size={32} aria-hidden="true" />
      <h2>{list && status === "error" ? "Jobs couldn’t load. Try again." : copy.title}</h2>
      <p>{list && status === "error" ? "Your jobs could not be loaded." : copy.body}</p>
      {status === "expired" ? (
        <Link className={s.entry} href={`/login?returnTo=${encodeURIComponent(returnTo)}`}>
          Sign in
        </Link>
      ) : (
        (status === "error" || status === "invalid") && (
          <RefreshJobs onClick={onRetry} label="Try again" />
        )
      )}
    </section>
  );
}

export function JobsEmpty({
  filtered,
  allEmpty,
  onChange,
}: {
  filtered: boolean;
  allEmpty: boolean;
  onChange: () => void;
}) {
  return (
    <section className={s.empty}>
      <BriefcaseBusiness size={34} className={s.emptyIcon} aria-hidden="true" />
      <h2>
        {allEmpty ? "No hired jobs yet" : filtered ? "No jobs with this status" : "No active jobs"}
      </h2>
      <p>
        {filtered && !allEmpty
          ? "Try a different status or return to Active jobs."
          : "Jobs appear here after a creator accepts your offer."}
      </p>
      {!allEmpty && (
        <button type="button" className={s.entry} onClick={onChange}>
          {filtered ? "Clear filter · Active jobs" : "View all my jobs"}
        </button>
      )}
      <Link href="/marketer/dashboard" className={s.inlineLink}>
        Back to overview
      </Link>
    </section>
  );
}

export function JobsSkeleton({ detail = false }: { detail?: boolean }) {
  return (
    <div
      className={detail ? s.detailGrid : s.skeletonStack}
      aria-busy="true"
      aria-label={detail ? "Loading job details" : "Loading jobs"}
    >
      {Array.from({ length: detail ? 2 : 3 }, (_, index) => (
        <div className={s.skeletonCard} key={index} aria-hidden="true">
          <div />
          <div />
          <div />
        </div>
      ))}
      <span className="sr-only">{detail ? "Loading job details…" : "Loading jobs…"}</span>
    </div>
  );
}

export function ListOperationNotice() {
  const { operation } = useJobsWorkspace();
  if (!operation) return null;
  if (operation.phase === "settled" && operation.result?.status !== "started") return null;
  const pending = operation.phase === "pending";
  const title = pending
    ? `Starting Job #${operation.jobId}`
    : operation.phase === "unknown"
      ? "Start status not confirmed"
      : `Job #${operation.jobId} started`;
  return (
    <JobsNotice
      title={title}
      busy={pending}
      tone={operation.phase === "unknown" ? "warning" : "info"}
      action={
        <Link className={s.utility} href={`/marketer/jobs/${operation.jobId}`}>
          {pending ? "View progress" : "View job"}
        </Link>
      }
    />
  );
}
