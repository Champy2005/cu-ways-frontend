"use client";

import { ArrowLeft, CheckCircle2, X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatPrice } from "../format";
import type { JobSummary as Job, OfferStatus } from "../types";

export function PageHeading({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
}) {
  return (
    <header className="ji-heading">
      <Button variant="ghost" size="icon" aria-label="Back to invitations" onClick={onBack}>
        <ArrowLeft aria-hidden="true" />
      </Button>
      <div>
        <h1 tabIndex={-1}>{title}</h1>
        {subtitle && <p className="ji-muted">{subtitle}</p>}
      </div>
    </header>
  );
}

export function JobSummary({ job }: { job: Job }) {
  return (
    <Card className="ji-card">
      <CardContent className="ji-summary">
        <h2>{job.title}</h2>
        <p className="ji-muted ji-job-id">{job.id}</p>
        <dl className="ji-terms">
          <div>
            <dt>Budget</dt>
            <dd>{formatPrice(job.budget)} fixed</dd>
          </div>
          <div>
            <dt>Target</dt>
            <dd>{job.target} responses</dd>
          </div>
          <div>
            <dt>Deadline</dt>
            <dd>{formatDate(job.deadline)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

export function OfferStatusText({ status }: { status: OfferStatus }) {
  return (
    <span className="ji-status-text" data-status={status}>
      {status === "Pending" ? "Offer pending review" : `Offer ${status.toLowerCase()}`}
    </span>
  );
}

export function Feedback({
  children,
  error = false,
  onDismiss,
}: {
  children: ReactNode;
  error?: boolean;
  onDismiss?: () => void;
}) {
  return (
    <div className="ji-feedback" data-error={error} role={error ? "alert" : "status"}>
      {!error && <CheckCircle2 size={20} aria-hidden="true" />}
      <div>{children}</div>
      {onDismiss && (
        <Button variant="ghost" size="icon" aria-label="Dismiss message" onClick={onDismiss}>
          <X size={16} />
        </Button>
      )}
    </div>
  );
}
