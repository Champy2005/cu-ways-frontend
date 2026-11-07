import Link from "next/link";
import type { ReactNode, RefObject } from "react";
import { Info } from "lucide-react";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { StatusText } from "@/components/ui/status-text";
import type { CreatorJobSummary, JobOfferComparison } from "../types";
import { formatSatang, toSatang } from "../payment";
import "../payment.css";

/**
 * Building blocks shared by the pages that save one job record, the payment
 * (US029) and the review (US033), so both use the same frame and job card.
 */

export function RecordPageHeader({
  jobId,
  headingRef,
  title,
  subtitle,
}: {
  jobId: number;
  headingRef: RefObject<HTMLHeadingElement | null>;
  title: string;
  subtitle: string;
}) {
  return (
    <header className="mb-7 flex items-center gap-1">
      <BackLink href={`/creator/jobs/${jobId}`} label="Back to job details" />
      <div>
        <h1
          ref={headingRef}
          id="record-heading"
          tabIndex={-1}
          className="text-lg leading-6 font-bold text-[var(--mk-text)] outline-none"
        >
          {title}
        </h1>
        <p className="mt-0.5 text-xs text-[var(--mk-muted)]">{subtitle}</p>
      </div>
    </header>
  );
}

export function JobSummaryCard({
  job,
  acceptedOffer,
}: {
  job: CreatorJobSummary;
  acceptedOffer: JobOfferComparison | null;
}) {
  const acceptedSatang = acceptedOffer ? toSatang(acceptedOffer.offered_price) : null;
  return (
    <section className="pay-card" aria-labelledby="record-job-heading">
      <h2
        id="record-job-heading"
        className="text-xs font-bold tracking-wide text-[var(--mk-muted)] uppercase"
      >
        Job overview
      </h2>
      <div className="mt-3 flex items-start justify-between gap-3">
        <p className="min-w-0 text-lg leading-5 font-bold wrap-break-word">
          {job.title || `Job #${job.job_id}`}
        </p>
        <StatusText status={job.job_status} />
      </div>
      <dl className="pay-details mt-3 border-t border-[var(--mk-border)] pt-3">
        <div>
          <dt>Job</dt>
          <dd>#{job.job_id}</dd>
        </div>
        <div>
          <dt>Selected marketer</dt>
          <dd>{acceptedOffer?.marketer.name ?? "Not selected"}</dd>
        </div>
        <div>
          <dt>Accepted price</dt>
          <dd>{acceptedSatang === null ? "-" : formatSatang(acceptedSatang)}</dd>
        </div>
      </dl>
    </section>
  );
}

export function BackToJobLink({
  jobId,
  label = "Back to job details",
}: {
  jobId: number;
  label?: string;
}) {
  return (
    <Link
      href={`/creator/jobs/${jobId}`}
      className="mk-secondary-button mt-4 inline-flex min-h-12 w-full items-center justify-center border px-4 text-sm font-bold"
    >
      {label}
    </Link>
  );
}

export function RecordUnavailableCard({
  jobId,
  title,
  message,
  linkLabel,
}: {
  jobId: number;
  title: string;
  message: string;
  linkLabel?: string;
}) {
  return (
    <div className="pay-card" role="status">
      <h2 className="pay-section-title">{title}</h2>
      <p className="mt-2 text-sm text-[var(--mk-muted)]">{message}</p>
      <BackToJobLink jobId={jobId} label={linkLabel} />
    </div>
  );
}

/**
 * The backend said the record exists (or a request had an unknown result) but
 * its details could not be read. Nothing is claimed about it.
 */
export function RecordStatusUnknownView({
  jobId,
  title,
  message,
  checkLabel,
  checking,
  onCheck,
}: {
  jobId: number;
  title: string;
  message: string;
  checkLabel: string;
  checking: boolean;
  onCheck: () => void;
}) {
  return (
    <section className="pay-card" aria-labelledby="record-unknown-heading">
      <h2 id="record-unknown-heading" className="pay-section-title">
        {title}
      </h2>
      <p role="alert" className="mt-2 text-sm text-[var(--mk-muted)]">
        {message}
      </p>
      <Button
        type="button"
        disabled={checking}
        onClick={onCheck}
        className="mk-primary-button mt-4 h-12 w-full text-sm font-bold text-white"
      >
        {checking ? "Checking…" : checkLabel}
      </Button>
      <BackToJobLink jobId={jobId} />
    </section>
  );
}

export function FormAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mk-error-notice rounded-lg p-3 text-sm">
      {message}
    </p>
  );
}

export function RecordNote({ children, role }: { children: ReactNode; role?: "status" }) {
  return (
    <p role={role} className="pay-note">
      <Info aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/**
 * aria-disabled (not disabled) while saving keeps focus here after the dialog
 * closes mid-save; the form's submit handler ignores it while a save runs.
 */
export function RecordSubmitButton({
  buttonRef,
  pending,
  pendingLabel,
  children,
}: {
  buttonRef: RefObject<HTMLButtonElement | null>;
  pending: boolean;
  pendingLabel: string;
  children: ReactNode;
}) {
  return (
    <Button
      ref={buttonRef}
      type="submit"
      aria-disabled={pending || undefined}
      className="mk-primary-button h-12 w-full text-sm font-bold text-white aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}
