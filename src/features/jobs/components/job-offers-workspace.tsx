"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, RefreshCw, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { JobOffersInitialData } from "../api";
import type { JobOfferComparison } from "../types";
import { useJobOffers } from "../use-job-offers";
import { AcceptOfferDialog } from "./accept-offer-dialog";
import { JobOffersCompare } from "./job-offers-compare";
import "../offers.css";

export function JobOffersWorkspace({ initialData }: { initialData: JobOffersInitialData }) {
  const state = useJobOffers(initialData);
  const [transitionPending, startTransition] = useTransition();
  const pending = state.pending || transitionPending;
  const { job, offers } = state.data;
  const [selection, setSelection] = useState<JobOfferComparison | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const hired = offers.find((offer) => offer.offer_status === "Accepted");
  const inviteHref = `/creator/jobs/${job.job_id}/invite`;
  function finalFocus() {
    if (trigger.current?.isConnected) return trigger.current;
    heading.current?.scrollIntoView?.({ block: "start" });
    return heading.current;
  }
  function confirm() {
    if (!selection || pending) return;
    startTransition(async () => {
      await state.accept(selection.offer_id);
      setSelection(null);
    });
  }
  return (
    <section className="jo-page">
      <header className="jo-heading">
        <Link href="/creator/jobs/offers" className="jo-back" aria-label="Back to your jobs">
          <ArrowLeft aria-hidden="true" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 ref={heading} tabIndex={-1}>
            Job offers
          </h1>
          <p className="jo-muted">
            Job #{job.job_id} ·{" "}
            {job.surveys.map((survey) => survey.title).join(", ") || "No linked surveys"}
          </p>
        </div>
        <span className="jo-status" data-status={job.job_status}>
          {job.job_status}
        </span>
      </header>
      <div className="jo-page-actions">
        <p className="jo-muted">
          {hired
            ? "Review your selected marketer and offer history."
            : "Compare proposals and choose a marketer for your job."}
        </p>
        <div className="jo-toolbar-actions">
          <Button
            variant="ghost"
            className="jo-refresh"
            disabled={pending}
            onClick={() => startTransition(state.refresh)}
          >
            <RefreshCw aria-hidden="true" className={pending ? "animate-spin" : ""} />
            {pending ? "Updating…" : "Refresh offers"}
          </Button>
          {job.job_status === "Pending" && offers.length > 0 && !state.locked && (
            <Link href={inviteHref} className="jo-invite">
              <UserPlus aria-hidden="true" />
              Invite marketers
            </Link>
          )}
        </div>
      </div>
      {state.notice && !(state.notice.kind === "success" && hired) && (
        <div
          className="jo-notice"
          data-error={state.notice.kind === "error"}
          role={state.notice.kind === "error" ? "alert" : "status"}
        >
          {state.notice.message}
          {state.locked && (
            <p className="mt-1">Accepting offers is paused until you refresh successfully.</p>
          )}
        </div>
      )}
      {hired && (
        <div className="jo-hired" role="status">
          <CheckCircle2 aria-hidden="true" />
          <div>
            <strong>{hired.marketer.name} is your selected marketer</strong>
            <p className="jo-muted">{formatHiredSummary(job.job_status)}</p>
          </div>
        </div>
      )}
      <JobOffersCompare
        key={state.revision}
        jobId={job.job_id}
        offers={offers}
        error={state.loadError}
        canAccept={job.job_status === "Pending" && !state.locked && !hired}
        pending={pending}
        onAccept={(offer, element) => {
          trigger.current = element;
          setSelection(offer);
        }}
        canInvite={job.job_status === "Pending" && !state.locked}
      />
      {selection && (
        <AcceptOfferDialog
          offer={selection}
          pending={pending}
          onConfirm={confirm}
          onClose={() => {
            if (!pending) setSelection(null);
          }}
          finalFocus={finalFocus}
        />
      )}
    </section>
  );
}

function formatHiredSummary(status: string) {
  return status === "Accepted"
    ? "Job accepted. The marketer can start the work next."
    : `Job status: ${status}. No further offers can be accepted.`;
}
