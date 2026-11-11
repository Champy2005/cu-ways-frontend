"use client";

import { useRef, useState } from "react";
import { CheckCircle2, CircleAlert, ExternalLink, FileCheck2, LoaderCircle, X } from "lucide-react";
import { StatusText } from "@/components/ui/status-text";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogOverlay,
  DialogPopup,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { parseProjectBriefUrl } from "@/features/jobs/project-brief";
import { JobsHeading, JobsNotice, RefreshJobs } from "./jobs-ui";
import {
  completionRequirements,
  formatEvidenceTime,
  type CompletionRequirement,
} from "./completion";
import { formatJobPrice, type DeliveryProof, type HiredJob, type JobsResult } from "./types";
import s from "./jobs.module.css";
import c from "./completion.module.css";

function CompletionSummary({ job }: { job: HiredJob }) {
  const evidence = job.completion;
  return (
    <section className={c.summaryCard} aria-labelledby="completion-job-title">
      <div className={s.cardHeading}>
        <div className={c.identity}>
          <p>Job #{job.id}</p>
          <h2 id="completion-job-title">
            {job.surveys.map((survey) => survey.title).join(" · ") || `Job #${job.id}`}
          </h2>
        </div>
        <StatusText status={job.status} />
      </div>
      <dl className={c.metadata}>
        <div>
          <dt>Creator</dt>
          <dd>{job.creator}</dd>
        </div>
        <div>
          <dt>Marketer</dt>
          <dd>{evidence?.status === "ready" ? evidence.marketer : "Not specified"}</dd>
        </div>
        <div>
          <dt>Agreed price</dt>
          <dd>{formatJobPrice(job.price)}</dd>
        </div>
      </dl>
    </section>
  );
}

function RequirementRow({ requirement }: { requirement: CompletionRequirement }) {
  const Icon = requirement.met ? CheckCircle2 : CircleAlert;
  return (
    <li className={c.requirement} data-met={requirement.met}>
      <Icon size={20} aria-hidden="true" />
      <div>
        <strong>
          <span className="sr-only">{requirement.met ? "Met: " : "Missing: "}</span>
          {requirement.label}
        </strong>
        {requirement.description && <p>{requirement.description}</p>}
      </div>
    </li>
  );
}

function ProofRecord({ proof }: { proof: DeliveryProof }) {
  const url = parseProjectBriefUrl(proof.url);
  const timestamp = formatEvidenceTime(proof.savedAt);
  return (
    <li className={c.proofRecord}>
      <span className={c.attachmentTag}>
        <FileCheck2 size={15} aria-hidden="true" />
        Proof
      </span>
      {url ? (
        <a href={url} className={c.proofLink} target="_blank" rel="noopener noreferrer">
          <span>{url}</span>
          <ExternalLink size={17} aria-hidden="true" />
          <span className="sr-only"> (new tab)</span>
        </a>
      ) : (
        <p className={c.muted}>Link unavailable</p>
      )}
      {timestamp && (
        <p className={c.timestamp}>
          Saved <time dateTime={proof.savedAt}>{timestamp}</time>
        </p>
      )}
    </li>
  );
}

function DeliveryEvidence({ proofs }: { proofs: DeliveryProof[] }) {
  return (
    <section className={c.card} aria-labelledby="delivery-evidence-heading">
      <h2 id="delivery-evidence-heading" tabIndex={-1}>
        Delivery evidence
      </h2>
      {proofs.length ? (
        <ul className={c.proofs} aria-label="Delivery proof attachments">
          {proofs.map((proof) => (
            <ProofRecord key={proof.id} proof={proof} />
          ))}
        </ul>
      ) : (
        <div className={c.emptyEvidence}>
          <FileCheck2 size={32} aria-hidden="true" />
          <h3>No proof added yet</h3>
          <p>Briefs and other attachments cannot replace delivery proof.</p>
        </div>
      )}
    </section>
  );
}

function CompletionCheckDialog({
  job,
  open,
  onClose,
  trigger,
}: {
  job: HiredJob;
  open: boolean;
  onClose: () => void;
  trigger: { current: HTMLButtonElement | null };
}) {
  const container = useRef<HTMLDivElement>(null);
  const safe = useRef<HTMLButtonElement>(null);
  const blockers = completionRequirements(job).filter((row) => !row.met);
  const missingProof = blockers.some((row) => row.label === "Proof of delivery");
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <div ref={container} />
      <DialogPortal container={container}>
        <DialogOverlay className={s.backdrop} />
        <DialogPopup
          className={s.dialog}
          initialFocus={safe}
          finalFocus={() => trigger.current ?? document.getElementById("jobs-heading")}
        >
          <div className={s.dialogHeading}>
            <DialogTitle>
              {blockers.length ? "Requirements incomplete" : "Ready for creator sign-off"}
            </DialogTitle>
            <DialogClose className={s.close} aria-label="Close completion check">
              <X size={22} aria-hidden="true" />
            </DialogClose>
          </div>
          <DialogDescription className={c.dialogReference}>Job #{job.id}</DialogDescription>
          {blockers.length ? (
            <ul className={c.blockers}>
              {blockers.map((row) => (
                <li key={row.label}>{row.blocker}</li>
              ))}
            </ul>
          ) : (
            <p>All completion requirements are met. The Creator can complete this job.</p>
          )}
          <div className={s.confirmActions}>
            <button ref={safe} type="button" className={s.utility} onClick={onClose}>
              Got it
            </button>
            {missingProof && (
              <button
                type="button"
                className={s.entry}
                onClick={() => {
                  onClose();
                  requestAnimationFrame(() => {
                    const heading = document.getElementById("delivery-evidence-heading");
                    heading?.scrollIntoView?.({ block: "center" });
                    heading?.focus();
                  });
                }}
              >
                View delivery evidence
              </button>
            )}
          </div>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}

export function JobCompletion({
  job,
  backHref,
  refreshing,
  readFailed,
  onRefresh,
}: {
  job: HiredJob;
  backHref: string;
  refreshing: boolean;
  readFailed: boolean;
  onRefresh: () => Promise<JobsResult<HiredJob>>;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const checking = useRef(false);
  const evidence = job.completion;
  const rows = completionRequirements(job);
  const completed = job.status === "Completed";
  const loading = evidence === undefined && !readFailed;

  async function check() {
    if (checking.current || refreshing || completed) return;
    checking.current = true;
    try {
      const latest = await onRefresh();
      if (
        latest.status === "success" &&
        latest.data.status === "In Progress" &&
        latest.data.completion?.status === "ready"
      )
        setDialogOpen(true);
    } finally {
      checking.current = false;
    }
  }

  return (
    <section className={s.page} aria-labelledby="jobs-heading" aria-busy={refreshing || loading}>
      <JobsHeading title="Job completion" backHref={backHref} />
      {completed && (
        <div className={c.completed} role="status">
          <CheckCircle2 size={22} aria-hidden="true" />
          <div>
            <h2>Job completed</h2>
            <p>
              {evidence?.status === "ready" && formatEvidenceTime(evidence.completedAt) ? (
                <>
                  Completed{" "}
                  <time dateTime={evidence.completedAt ?? undefined}>
                    {formatEvidenceTime(evidence.completedAt)}
                  </time>
                </>
              ) : (
                "This job is closed."
              )}
            </p>
          </div>
        </div>
      )}
      <CompletionSummary job={job} />
      {refreshing && <JobsNotice title="Checking completion requirements…" busy />}
      {loading ? (
        <div className={c.loading} role="status">
          <LoaderCircle size={20} className={s.spinner} aria-hidden="true" />
          Loading completion requirements…
        </div>
      ) : evidence?.status !== "ready" || readFailed ? (
        <JobsNotice
          title="Completion requirements unavailable"
          tone="error"
          action={
            <RefreshJobs
              onClick={() => {
                void onRefresh();
              }}
              disabled={refreshing}
              label="Try again"
            />
          }
        >
          We couldn’t verify delivery proof and payment. Refresh to check the latest requirements.
        </JobsNotice>
      ) : (
        <div className={c.columns}>
          <section className={c.card} aria-labelledby="completion-requirements-heading">
            <h2 id="completion-requirements-heading">Completion requirements</h2>
            <p className={c.requirementCount}>
              {rows.filter((row) => row.met).length} of 4 requirements met
            </p>
            <ul className={c.criteria}>
              {rows.map((row) => (
                <RequirementRow key={row.label} requirement={row} />
              ))}
            </ul>
            {!completed && (
              <div className={c.actions}>
                <button
                  ref={trigger}
                  type="button"
                  className={s.primary}
                  disabled={refreshing}
                  onClick={() => {
                    void check();
                  }}
                >
                  Run completion check
                </button>
                <RefreshJobs
                  onClick={() => {
                    void onRefresh();
                  }}
                  disabled={refreshing}
                  label="Refresh requirements"
                />
              </div>
            )}
            {!completed && <p className={c.signOff}>Final sign-off is completed by the Creator.</p>}
          </section>
          <DeliveryEvidence proofs={evidence.proofs} />
        </div>
      )}
      <CompletionCheckDialog
        job={job}
        open={dialogOpen && !completed && evidence?.status === "ready" && !readFailed}
        onClose={() => setDialogOpen(false)}
        trigger={trigger}
      />
    </section>
  );
}
