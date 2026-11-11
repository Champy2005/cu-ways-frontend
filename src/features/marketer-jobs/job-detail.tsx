"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { LoaderCircle, X } from "lucide-react";
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
import { loadHiredJob } from "./actions";
import { clearStartCheck, useJobsWorkspace, useStartNeedsCheck } from "./jobs-workspace";
import { JobsFailure, JobsHeading, JobsNotice, JobsSkeleton, RefreshJobs } from "./jobs-ui";
import {
  applyStartedJob,
  formatJobDate,
  formatJobPrice,
  type HiredJob,
  type JobsResult,
} from "./types";
import s from "./jobs.module.css";

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function SurveyContext({ job }: { job: HiredJob }) {
  return (
    <section className={s.surveyContext} aria-labelledby="survey-heading">
      <div className={s.cardHeading}>
        <h2 id="survey-heading">{job.surveys.length === 1 ? "Survey" : "Surveys"}</h2>
        {job.surveys.length > 1 && <span className={s.count}>{job.surveys.length} total</span>}
      </div>
      <ul className={s.surveys}>
        {job.surveys.map((survey) => (
          <li key={survey.id}>{survey.title}</li>
        ))}
      </ul>
      <dl className={s.detailFacts}>
        <Fact label="Creator">{job.creator}</Fact>
        <Fact label="Agreed delivery">{formatJobDate(job.deliveryDate)}</Fact>
        <Fact label="Deadline">{formatJobDate(job.deadline)}</Fact>
        <Fact label="Target responses">
          {job.targetResponses === null
            ? "Target not specified"
            : `${job.targetResponses.toLocaleString("en-US")} responses`}
        </Fact>
        <Fact label="Brief">
          {job.briefUrl ? (
            <a
              href={job.briefUrl}
              className={s.inlineLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open brief<span className="sr-only"> (new tab)</span>
            </a>
          ) : (
            "No brief attached"
          )}
        </Fact>
      </dl>
    </section>
  );
}

function StartDialog({
  job,
  pending,
  open,
  onClose,
  onStart,
}: {
  job: HiredJob;
  pending: boolean;
  open: boolean;
  onClose: () => void;
  onStart: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
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
          initialFocus={() => (pending ? title.current : cancel.current)}
          finalFocus={() =>
            document.getElementById("start-job") ?? document.getElementById("jobs-heading")
          }
        >
          <div className={s.dialogHeading}>
            <DialogTitle ref={title} tabIndex={-1}>
              {pending ? "Starting job" : "Start job"}
            </DialogTitle>
            <DialogClose className={s.close} aria-label="Close">
              <X size={22} aria-hidden="true" />
            </DialogClose>
          </div>
          <DialogDescription className={s.dialogReference}>Job #{job.id}</DialogDescription>
          <dl className={s.dialogPrice}>
            <dt>Agreed price</dt>
            <dd>{formatJobPrice(job.price)}</dd>
          </dl>
          {pending ? (
            <>
              <p className={s.progress} role="status">
                <LoaderCircle size={19} className={s.spinner} aria-hidden="true" />
                Submitting…
              </p>
              <button type="button" className={s.utility} onClick={onClose}>
                Continue browsing
              </button>
            </>
          ) : (
            <div className={s.confirmActions}>
              <button ref={cancel} type="button" className={s.utility} onClick={onClose}>
                Cancel
              </button>
              <button type="button" className={s.primary} onClick={onStart}>
                Start job
              </button>
            </div>
          )}
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}

function useDetailState(id: string, initial: JobsResult<HiredJob>) {
  const [result, setResult] = useState(initial);
  const [refreshing, startRefresh] = useTransition();
  const [readFailed, setReadFailed] = useState(false);
  const [offline, setOffline] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previousInitial, setPreviousInitial] = useState(initial);
  if (previousInitial !== initial) {
    setPreviousInitial(initial);
    setResult(initial);
    setReadFailed(false);
  }
  const { operation, busy, start, clear } = useJobsWorkspace();
  const needsCheck = useStartNeedsCheck(Number(id));
  const current = operation?.jobId === Number(id) ? operation : null;
  const outcome = current?.result;
  const pending = current?.phase === "pending";
  const job = result.status === "success" ? applyStartedJob(result.data, outcome) : null;
  const unavailable =
    outcome && ["expired", "unavailable", "forbidden"].includes(outcome.status)
      ? (outcome.status as "expired" | "unavailable" | "forbidden")
      : null;
  const blocked =
    needsCheck || (!!current && current.phase !== "settled") || (!!outcome && !("job" in outcome));
  const showDialog = dialogOpen && (pending || !outcome);

  useEffect(() => {
    if (outcome?.status === "started" || outcome?.status === "already-started")
      document.getElementById("jobs-heading")?.focus();
  }, [outcome]);

  function refresh() {
    startRefresh(async () => {
      const next = await loadHiredJob(id).catch(() => ({ status: "error" as const }));
      if (next.status === "error" && job) {
        setReadFailed(true);
        return;
      }
      setReadFailed(false);
      setResult(next);
      if (next.status === "success" && next.data.status !== "Accepted") {
        clearStartCheck(next.data.id);
        clear();
      } else if (current?.phase === "settled") clear();
    });
  }

  function askStart() {
    if (busy || blocked || refreshing || !job || job.status !== "Accepted") return;
    if (!navigator.onLine) {
      setOffline(true);
      return;
    }
    setOffline(false);
    clear();
    setDialogOpen(true);
  }

  function confirm() {
    if (!job || pending || blocked) return;
    if (!navigator.onLine) {
      setOffline(true);
      setDialogOpen(false);
      return;
    }
    void start(job.id);
  }

  return {
    result,
    job,
    current,
    outcome,
    pending,
    blocked,
    refreshing,
    readFailed,
    offline,
    showDialog,
    setDialogOpen,
    refresh,
    askStart,
    confirm,
    unavailable,
    busy,
  };
}

function DetailFeedback({ state }: { state: ReturnType<typeof useDetailState> }) {
  const {
    current,
    pending,
    blocked,
    refreshing,
    readFailed,
    offline,
    outcome,
    refresh,
    setDialogOpen,
  } = state;
  if (refreshing) return <JobsNotice title="Checking job status…" busy />;
  if (pending)
    return (
      <JobsNotice
        title={`Starting Job #${current?.jobId}`}
        busy
        action={
          <button type="button" className={s.utility} onClick={() => setDialogOpen(true)}>
            View progress
          </button>
        }
      />
    );
  if (blocked)
    return (
      <JobsNotice
        title="Start status not confirmed"
        tone="warning"
        action={<RefreshJobs onClick={refresh} />}
      >
        We couldn’t confirm whether this job started. Refresh to check its current status before
        trying again.
      </JobsNotice>
    );
  if (readFailed)
    return (
      <JobsNotice
        title="Latest details unavailable"
        tone="warning"
        action={<RefreshJobs onClick={refresh} />}
      >
        Couldn’t load the latest details. Showing the last confirmed information.
      </JobsNotice>
    );
  if (offline)
    return (
      <JobsNotice title="You’re offline" tone="warning">
        Reconnect and refresh before starting.
      </JobsNotice>
    );
  if (outcome?.status === "already-started")
    return <JobsNotice title="This job is already in progress." />;
  return null;
}

export function JobDetail({
  id,
  initial,
  backHref,
}: {
  id: string;
  initial: JobsResult<HiredJob>;
  backHref: string;
}) {
  const state = useDetailState(id, initial);
  const { job, result, pending, refreshing, blocked, unavailable } = state;
  if (unavailable || !job)
    return (
      <section className={s.page}>
        <JobsHeading title="Job details" backHref={backHref} />
        {refreshing ? (
          <JobsSkeleton detail />
        ) : (
          <JobsFailure
            status={unavailable ?? (result.status === "success" ? "invalid" : result.status)}
            returnTo={`/marketer/jobs/${id}`}
            onRetry={state.refresh}
          />
        )}
      </section>
    );
  const canStart = job.status === "Accepted" && !blocked;
  const terminal = job.status === "Completed" || job.status === "Cancelled";
  return (
    <section className={s.page} aria-labelledby="jobs-heading" aria-busy={refreshing}>
      <JobsHeading title={`Job #${job.id}`} backHref={backHref} />
      {!state.showDialog && <DetailFeedback state={state} />}
      <div className={s.detailGrid}>
        <SurveyContext job={job} />
        <section className={s.contract} aria-labelledby="contract-heading">
          <div className={s.cardHeading}>
            <h2 id="contract-heading">Contract</h2>
            {!blocked && <StatusText status={job.status} />}
          </div>
          {(blocked || state.readFailed) && (
            <p className={s.provenance}>Last confirmed: {job.status}</p>
          )}
          <dl className={s.price}>
            <dt>Agreed price</dt>
            <dd>{formatJobPrice(job.price)}</dd>
          </dl>
          {!terminal && (
            <div className={s.contractActions}>
              {canStart && (
                <button
                  type="button"
                  id="start-job"
                  className={s.primary}
                  disabled={state.busy || refreshing}
                  onClick={state.askStart}
                >
                  Start job
                </button>
              )}
              <RefreshJobs onClick={state.refresh} disabled={pending || refreshing} />
            </div>
          )}
        </section>
      </div>
      <StartDialog
        job={job}
        pending={pending}
        open={state.showDialog}
        onClose={() => state.setDialogOpen(false)}
        onStart={state.confirm}
      />
    </section>
  );
}
