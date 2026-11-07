"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { Info } from "lucide-react";
import { SuccessToast } from "@/components/feedback/success-toast";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { StatusText } from "@/components/ui/status-text";
import type { JobPaymentData } from "../api";
import {
  PAYABLE_JOB_STATUSES,
  formatSatang,
  toSatang,
  validatePaymentForm,
  type ActivePayment,
  type PaymentFormErrors,
  type PaymentMethod,
} from "../payment";
import { checkJobPayment, recordJobPayment, type RecordPaymentResult } from "../payment-actions";
import { PaymentAmountField } from "./payment-amount-field";
import { PaymentConfirmDialog } from "./payment-confirm-dialog";
import { PaymentMethodOptions } from "./payment-method-options";
import { PaymentRecordedView, PaymentStatusUnknownView } from "./payment-recorded-view";
import "../offers.css";
import "../payment.css";

type Outcome =
  | { kind: "form" }
  | { kind: "payment"; payment: ActivePayment; notice?: string }
  | { kind: "unknown"; title: string; message: string }
  | { kind: "unavailable"; message: string };

type FocusTarget = "review" | "amount" | "heading";

function unavailableReason({ job, acceptedOffer }: JobPaymentData): string | null {
  if (!PAYABLE_JOB_STATUSES.includes(job.job_status)) {
    return job.job_status === "Cancelled"
      ? "This job was cancelled, so a payment cannot be recorded."
      : "An accepted offer is required before you can record a payment. Accept a marketer's offer first.";
  }
  if (!acceptedOffer || toSatang(acceptedOffer.offered_price) === null) {
    return "This job has no accepted offer to pay. Return to the job to check its offers.";
  }
  return null;
}

function JobOverviewCard({
  data: { job, acceptedOffer },
  acceptedSatang,
}: {
  data: JobPaymentData;
  acceptedSatang: number;
}) {
  return (
    <section className="pay-card" aria-labelledby="payment-job-heading">
      <h2
        id="payment-job-heading"
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
          <dd>{acceptedOffer ? formatSatang(acceptedSatang) : "-"}</dd>
        </div>
      </dl>
    </section>
  );
}

/** A payment the backend already holds always wins over showing the form again. */
function initialOutcome(data: JobPaymentData): Outcome {
  if (data.currentPayment) return { kind: "payment", payment: data.currentPayment };
  const reason = unavailableReason(data);
  return reason ? { kind: "unavailable", message: reason } : { kind: "form" };
}

export function JobPaymentPage({ data }: { data: JobPaymentData }) {
  const { job, acceptedOffer } = data;
  const acceptedSatang = acceptedOffer ? (toSatang(acceptedOffer.offered_price) ?? 0) : 0;

  const [outcome, setOutcome] = useState<Outcome>(() => initialOutcome(data));
  const [method, setMethod] = useState<PaymentMethod | "">("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<PaymentFormErrors>({});
  const [validated, setValidated] = useState(false);
  const [formAlert, setFormAlert] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const heading = useRef<HTMLHeadingElement>(null);
  const firstMethod = useRef<HTMLInputElement>(null);
  const amountInput = useRef<HTMLInputElement>(null);
  const reviewButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<FocusTarget>("review");
  // Read inside async results, where the `reviewing` state would be stale.
  const dialogOpen = useRef(false);
  const focusAfterResult = useRef<FocusTarget | null>(null);

  const hasPayment = outcome.kind === "payment" || outcome.kind === "unknown";
  const title = hasPayment ? "Payment details" : "Record payment";
  const subtitle = hasPayment
    ? "The payment recorded for this job."
    : "Record the agreed payment for this job.";

  // A result that lands after the dialog was closed has no dialog to return
  // focus, so move it here once the new state has rendered.
  useEffect(() => {
    const target = focusAfterResult.current;
    if (!target || reviewing) return;
    focusAfterResult.current = null;
    if (target === "amount") amountInput.current?.focus();
    else if (target === "heading") heading.current?.focus();
  }, [outcome, errors, reviewing]);

  function revalidate(next: { method?: PaymentMethod | ""; amount?: string }) {
    if (!validated) return;
    setErrors(
      validatePaymentForm(
        { method: next.method ?? method, amount: next.amount ?? amount },
        acceptedSatang,
      ),
    );
  }

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setValidated(true);
    setFormAlert(null);
    const nextErrors = validatePaymentForm({ method, amount }, acceptedSatang);
    setErrors(nextErrors);
    if (nextErrors.method) return firstMethod.current?.focus();
    if (nextErrors.amount) return amountInput.current?.focus();
    setDialogError(null);
    returnFocus.current = "review";
    dialogOpen.current = true;
    setReviewing(true);
  }

  function closeDialog(focus: FocusTarget) {
    returnFocus.current = focus;
    dialogOpen.current = false;
    setReviewing(false);
  }

  /** Leaves the form for a result view, moving focus to the page heading. */
  function settle(next: Outcome) {
    if (dialogOpen.current) closeDialog("heading");
    else focusAfterResult.current = "heading";
    setFormAlert(null);
    setOutcome(next);
  }

  function showError(message: string) {
    if (dialogOpen.current) setDialogError(message);
    else setFormAlert(message);
  }

  function applyResult(result: RecordPaymentResult) {
    switch (result.status) {
      case "recorded":
        settle({ kind: "payment", payment: result.payment });
        setToast("The payment is saved as Paid for this job.");
        return;
      case "existing":
        settle({ kind: "payment", payment: result.payment, notice: result.message });
        return;
      case "existing_unconfirmed":
        settle({ kind: "unknown", title: "Payment already exists", message: result.message });
        return;
      case "unknown":
        settle({ kind: "unknown", title: "Payment status unknown", message: result.message });
        return;
      case "unavailable":
        settle({ kind: "unavailable", message: result.message });
        return;
      case "mismatch":
        if (dialogOpen.current) closeDialog("amount");
        else focusAfterResult.current = "amount";
        setErrors((current) => ({ ...current, amount: result.message }));
        setFormAlert(result.message);
        return;
      case "error":
        // Keep the entered values so the Creator can retry or go back.
        showError(result.message);
    }
  }

  function confirm() {
    if (pending || !method) return;
    startTransition(async () => {
      applyResult(await recordJobPayment(job.job_id, method, amount.trim()));
    });
  }

  function checkStatus() {
    if (pending) return;
    startTransition(async () => {
      const result = await checkJobPayment(job.job_id);
      if (result.status === "found") {
        settle({ kind: "payment", payment: result.payment });
      } else if (result.status === "none") {
        const reason = unavailableReason(data);
        settle(reason ? { kind: "unavailable", message: reason } : { kind: "form" });
        if (!reason)
          setFormAlert("No payment is recorded for this job yet. You can submit it now.");
      } else {
        setOutcome((current) =>
          current.kind === "unknown" ? { ...current, message: result.message } : current,
        );
      }
    });
  }

  function finalFocus() {
    if (returnFocus.current === "amount") return amountInput.current;
    if (returnFocus.current === "heading") return heading.current;
    return reviewButton.current;
  }

  return (
    <section aria-labelledby="payment-heading" className="mx-auto w-full max-w-md">
      <header className="mb-7 flex items-center gap-1">
        <BackLink href={`/creator/jobs/${job.job_id}`} label="Back to job details" />
        <div>
          <h1
            ref={heading}
            id="payment-heading"
            tabIndex={-1}
            className="text-lg leading-6 font-bold text-[var(--mk-text)] outline-none"
          >
            {title}
          </h1>
          <p className="mt-0.5 text-xs text-[var(--mk-muted)]">{subtitle}</p>
        </div>
      </header>

      <SuccessToast title="Payment recorded" message={toast} onDismiss={() => setToast(null)} />

      <div className="space-y-4">
        <JobOverviewCard data={data} acceptedSatang={acceptedSatang} />

        {outcome.kind === "unavailable" && (
          <div className="pay-card" role="status">
            <h2 className="pay-section-title">Payment is not available</h2>
            <p className="mt-2 text-sm text-[var(--mk-muted)]">{outcome.message}</p>
            <Link
              href={`/creator/jobs/${job.job_id}`}
              className="mk-secondary-button mt-4 inline-flex min-h-12 w-full items-center justify-center border px-4 text-sm font-bold"
            >
              Back to job details
            </Link>
          </div>
        )}

        {outcome.kind === "payment" && (
          <PaymentRecordedView
            jobId={job.job_id}
            payment={outcome.payment}
            notice={outcome.notice}
          />
        )}
        {outcome.kind === "unknown" && (
          <PaymentStatusUnknownView
            jobId={job.job_id}
            title={outcome.title}
            message={outcome.message}
            checking={pending}
            onCheck={checkStatus}
          />
        )}

        {outcome.kind === "form" && (
          <form className="pay-card space-y-6" noValidate onSubmit={review}>
            <div>
              <h2 className="pay-section-title">Payment record</h2>
              <p className="pay-help">Choose the method used for the agreed amount.</p>
            </div>
            {formAlert && (
              <p role="alert" className="mk-error-notice rounded-lg p-3 text-sm">
                {formAlert}
              </p>
            )}
            {pending && !reviewing && (
              <p role="status" className="pay-note">
                <Info aria-hidden="true" />
                <span>
                  Still recording this payment. This page updates when it finishes, and the payment
                  will not be recorded twice.
                </span>
              </p>
            )}
            <PaymentMethodOptions
              value={method}
              error={errors.method}
              firstOptionRef={firstMethod}
              onChange={(next) => {
                setMethod(next);
                revalidate({ method: next });
              }}
            />
            <PaymentAmountField
              value={amount}
              acceptedSatang={acceptedSatang}
              error={errors.amount}
              inputRef={amountInput}
              onChange={(next) => {
                setAmount(next);
                setFormAlert(null);
                revalidate({ amount: next });
              }}
            />
            <p className="pay-note">
              <Info aria-hidden="true" />
              <span>This records a payment only. No money is collected or transferred.</span>
            </p>
            <Button
              ref={reviewButton}
              type="submit"
              // aria-disabled keeps focus here after the dialog closes mid-save;
              // review() ignores the click while a request is in flight.
              aria-disabled={pending || undefined}
              className="mk-primary-button h-12 w-full text-sm font-bold text-white aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
            >
              {pending ? "Recording…" : "Review payment"}
            </Button>
          </form>
        )}
      </div>

      {reviewing && method && acceptedOffer && (
        <PaymentConfirmDialog
          marketerName={acceptedOffer.marketer.name}
          method={method}
          amountSatang={toSatang(amount) ?? 0}
          pending={pending}
          error={dialogError}
          onConfirm={confirm}
          onClose={() => closeDialog("review")}
          finalFocus={finalFocus}
        />
      )}
    </section>
  );
}
