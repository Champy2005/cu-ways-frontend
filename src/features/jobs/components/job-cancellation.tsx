"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, X } from "lucide-react";
import { NotificationToast } from "@/components/feedback/success-toast";
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
import { cancelCreatorJob, loadCancellationDetails } from "../cancellation-actions";
import type { CreatorJobSummary } from "../types";
import {
  cancellationBlockedReason,
  cancellationCheckKey,
  type CancellationDetails,
  type CancellationRead,
} from "../cancellation";
import s from "./job-cancellation.module.css";

type ReadState = CancellationRead | { status: "loading" };
type Phase = "idle" | "reading" | "pending" | "check";

export function JobCancellation({
  jobId,
  creatorId,
  status,
}: {
  jobId: string;
  creatorId: number;
  status?: CreatorJobSummary["job_status"];
}) {
  // Keep cancellation history and post-reload confirmation for Cancelled jobs.
  if (status === "Completed") return null;
  return <CancellationSection key={`${creatorId}:${jobId}`} jobId={jobId} creatorId={creatorId} />;
}

function useCancellation({ jobId, creatorId }: { jobId: string; creatorId: number }) {
  const [read, setRead] = useState<ReadState>({ status: "loading" });
  const [phase, setPhase] = useState<Phase>("reading");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [toast, setToast] = useState(false);
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const mounted = useRef(false);
  const mutation = useRef(false);
  const reading = useRef(false);
  const safeButton = useRef<HTMLButtonElement>(null);
  const checkKey = cancellationCheckKey(creatorId, jobId);
  const successKey = `${checkKey}:success`;

  function storeCheck(value: boolean) {
    try {
      if (value) sessionStorage.setItem(checkKey, "1");
      else sessionStorage.removeItem(checkKey);
    } catch {
      /* The live operation remains guarded when storage is unavailable. */
    }
  }

  useEffect(() => {
    mounted.current = true;
    let active = true;
    let uncertain = false;
    let showSuccess = false;
    try {
      uncertain = sessionStorage.getItem(checkKey) === "1";
      showSuccess = sessionStorage.getItem(successKey) === "1";
    } catch {
      /* The authorized read still determines what can be displayed. */
    }
    // Hydrate the browser-only notice without waiting for the network read.
    queueMicrotask(() => {
      if (active) setToast(showSuccess);
    });
    const timer = setTimeout(() => {
      if (!active) return;
      setRead({
        status: "error",
        message: "Cancellation details took too long to load. Refresh to try again.",
      });
      setPhase(uncertain ? "check" : "idle");
    }, 12_000);
    void loadCancellationDetails(jobId, creatorId)
      .then((next) => {
        if (!active) return;
        clearTimeout(timer);
        setRead(next);
        if (next.status === "ready" && next.details.status === "Cancelled") {
          try {
            sessionStorage.removeItem(checkKey);
          } catch {
            /* Best effort. */
          }
          setPhase("idle");
        } else setPhase(uncertain ? "check" : "idle");
      })
      .catch(() => {
        if (!active) return;
        clearTimeout(timer);
        setRead({
          status: "error",
          message: "Cancellation details could not be loaded. Refresh to try again.",
        });
        setPhase(uncertain ? "check" : "idle");
      });
    return () => {
      active = false;
      mounted.current = false;
      clearTimeout(timer);
    };
  }, [jobId, creatorId, checkKey, successKey]);

  useEffect(() => {
    if (!toast) return;
    // Consume only after rendering the toast, independently of the details read.
    try {
      sessionStorage.removeItem(successKey);
    } catch {
      /* Best effort. */
    }
  }, [toast, successKey]);

  async function refresh() {
    if (reading.current || phase === "pending") return;
    reading.current = true;
    setPhase("reading");
    setOpen(false);
    const next = await loadCancellationDetails(jobId, creatorId).catch(() => ({
      status: "error" as const,
      message: "Cancellation details could not be verified. Try refreshing again.",
    }));
    reading.current = false;
    if (!mounted.current) return;
    setRead(next);
    if (next.status === "ready" && (!mutation.current || next.details.status === "Cancelled")) {
      storeCheck(false);
      setMessage(null);
      setPhase("idle");
    } else setPhase("check");
  }

  async function confirm() {
    if (
      mutation.current ||
      phase !== "idle" ||
      read.status !== "ready" ||
      cancellationBlockedReason(read.details)
    )
      return;
    mutation.current = true;
    storeCheck(true);
    setPhase("pending");
    setMessage(null);
    const timer = setTimeout(() => {
      if (!mounted.current) return;
      setPhase("check");
      setOpen(false);
      setMessage("The cancellation result is unknown. Check the current job before trying again.");
    }, 12_000);
    const result = await cancelCreatorJob(jobId, creatorId).catch(() => ({
      status: "unknown" as const,
      message: "The cancellation result is unknown. Check the current job before trying again.",
    }));
    clearTimeout(timer);
    mutation.current = false;
    if (result.status === "cancelled") storeCheck(false);
    if (!mounted.current) return;
    setOpen(false);
    if (result.status === "cancelled") {
      setRead({ status: "ready", details: result.details });
      setPhase("idle");
      try {
        sessionStorage.setItem(successKey, "1");
      } catch {
        /* The saved Cancelled state also confirms success. */
      }
      // Refresh the existing job editor and workflow through their normal load paths.
      window.location.reload();
    } else if (result.status === "unavailable") {
      setRead({ status: "unavailable", message: result.message });
      setPhase("check");
      setMessage(null);
    } else {
      setPhase("check");
      setMessage(result.message);
    }
  }

  return {
    jobId,
    read,
    phase,
    open,
    message,
    toast,
    portal,
    safeButton,
    setOpen,
    setPortal,
    setToast,
    refresh,
    confirm,
  };
}

function CancellationSection(props: { jobId: string; creatorId: number }) {
  const state = useCancellation(props);
  const { jobId, read, phase, message, toast, setOpen, setPortal, setToast, refresh } = state;
  const details = read.status === "ready" ? read.details : null;
  const reason = details ? cancellationBlockedReason(details) : null;
  const busy = phase === "reading" || phase === "pending";

  return (
    <section className={s.section} aria-labelledby="job-cancellation-heading">
      <NotificationToast
        notification={
          toast
            ? {
                id: `cancelled-${jobId}`,
                kind: "success",
                title: "Job cancelled",
                message: "Active requests are closed and Pending offers are rejected.",
              }
            : null
        }
        onDismiss={() => setToast(false)}
      />
      <div className={s.heading}>
        <h2 id="job-cancellation-heading">Cancellation</h2>
        {details && <StatusText status={details.status} />}
      </div>
      {read.status === "loading" ? (
        <p role="status" className={s.notice}>
          Loading cancellation details…
        </p>
      ) : read.status !== "ready" ? (
        <p role="alert" className={s.notice}>
          {read.message}
        </p>
      ) : (
        <CancellationContract details={read.details} />
      )}
      {phase === "pending" && (
        <div className={s.feedback} role="status">
          <LoaderCircle className={s.spinner} size={18} aria-hidden="true" /> Cancelling job…{" "}
          <button className={s.quiet} onClick={() => setOpen(true)}>
            View progress
          </button>
        </div>
      )}
      {phase === "reading" && read.status !== "loading" && (
        <p className={s.feedback} role="status">
          Checking current job…
        </p>
      )}
      {phase === "check" && read.status !== "unavailable" && (
        <p className={s.notice} role="alert">
          {message ?? "Check the current job before attempting cancellation again."}
        </p>
      )}
      <div className={s.actions}>
        {details && !reason && phase === "idle" && (
          <button type="button" className={s.destructive} onClick={() => setOpen(true)}>
            Cancel job
          </button>
        )}
        <button
          type="button"
          className={s.supporting}
          disabled={busy}
          onClick={() => void refresh()}
        >
          {phase === "check" ? "Check current job" : "Refresh cancellation details"}
        </button>
      </div>
      <div ref={setPortal} />
      <CancellationDialog state={state} />
    </section>
  );
}

function CancellationContract({ details }: { details: CancellationDetails }) {
  const reason = cancellationBlockedReason(details);
  const cancelled = details.status === "Cancelled";
  return (
    <>
      <p className={s.reference}>
        Job #{details.jobId} · {details.title}
      </p>
      {cancelled ? (
        <p className={s.notice}>
          This job has been cancelled. Its contract and history are retained.
        </p>
      ) : (
        reason && <p className={s.notice}>{reason}</p>
      )}
      <h3 className={s.subheading}>Contract summary</h3>
      <dl className={s.rows}>
        <div>
          <dt>Payment</dt>
          <dd>{details.paid ? "Paid" : "Not paid"}</dd>
        </div>
        <div>
          <dt>Active requests</dt>
          <dd>{details.activeRequests}</dd>
        </div>
        <div>
          <dt>Pending offers</dt>
          <dd>{details.pendingOffers}</dd>
        </div>
        {cancelled && details.cancelledAt && (
          <div>
            <dt>Cancelled</dt>
            <dd>
              {new Intl.DateTimeFormat("en-GB", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "Asia/Bangkok",
              }).format(new Date(details.cancelledAt))}{" "}
              ICT
            </dd>
          </div>
        )}
        {cancelled && details.reason && (
          <div>
            <dt>Reason</dt>
            <dd>{details.reason}</dd>
          </div>
        )}
      </dl>
      {!reason && (
        <>
          <h3 className={s.subheading}>Cancellation effects</h3>
          <ul className={s.effects}>
            <li>Active requests will close.</li>
            <li>Pending offers will be rejected.</li>
          </ul>
          <p className={s.retained}>The accepted offer and history are retained.</p>
        </>
      )}
    </>
  );
}

function CancellationDialog({ state }: { state: ReturnType<typeof useCancellation> }) {
  const { jobId, read, open, setOpen, phase, portal, safeButton, confirm } = state;
  const details = read.status === "ready" ? read.details : null;
  return (
    <Dialog open={open && read.status === "ready"} onOpenChange={setOpen}>
      <DialogPortal container={portal}>
        <DialogOverlay />
        <DialogPopup className={s.dialog} initialFocus={safeButton}>
          <div className={s.heading}>
            <DialogTitle>{phase === "pending" ? "Cancelling job" : "Cancel job"}</DialogTitle>
            <DialogClose className={s.close} aria-label="Close cancellation dialog">
              <X size={20} aria-hidden="true" />
            </DialogClose>
          </div>
          <div className={s.dialogBody}>
            <p className={s.reference}>
              Job #{jobId} · {details?.title}
            </p>
            <DialogDescription className={s.description}>
              {phase === "pending"
                ? "You can continue browsing while this request is processed. Closing this dialog does not cancel the request."
                : "This cannot be undone. Active requests will close, Pending offers will be rejected, and the contract history will be retained."}
            </DialogDescription>
            {phase === "pending" ? (
              <p role="status" className={s.feedback}>
                <LoaderCircle size={18} className={s.spinner} aria-hidden="true" /> Submitting…
              </p>
            ) : (
              <dl className={s.rows}>
                <div>
                  <dt>Current status</dt>
                  <dd>{details?.status}</dd>
                </div>
                <div>
                  <dt>Requests to close</dt>
                  <dd>{details?.activeRequests}</dd>
                </div>
                <div>
                  <dt>Offers to reject</dt>
                  <dd>{details?.pendingOffers}</dd>
                </div>
              </dl>
            )}
          </div>
          <div className={s.actions}>
            <DialogClose ref={safeButton} className={s.supporting}>
              {phase === "pending" ? "Continue browsing" : "Keep job"}
            </DialogClose>
            {phase !== "pending" && (
              <button type="button" className={s.destructive} onClick={() => void confirm()}>
                Confirm cancellation
              </button>
            )}
          </div>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
