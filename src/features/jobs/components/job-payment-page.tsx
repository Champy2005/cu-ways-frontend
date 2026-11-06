"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
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
  type PaymentFormErrors,
  type PaymentMethod,
  type RecordedPayment,
} from "../payment";
import { recordJobPayment } from "../payment-actions";
import { PaymentAmountField } from "./payment-amount-field";
import { PaymentConfirmDialog } from "./payment-confirm-dialog";
import { PaymentMethodOptions } from "./payment-method-options";
import { PaymentRecordedView } from "./payment-recorded-view";
import "../offers.css";
import "../payment.css";

type Outcome =
  | { kind: "form" }
  | { kind: "recorded"; payment: RecordedPayment }
  | { kind: "already_recorded"; message: string }
  | { kind: "unavailable"; message: string };

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

export function JobPaymentPage({ data }: { data: JobPaymentData }) {
  const { job, acceptedOffer } = data;
  const initialReason = unavailableReason(data);
  const acceptedSatang = acceptedOffer ? (toSatang(acceptedOffer.offered_price) ?? 0) : 0;

  const [outcome, setOutcome] = useState<Outcome>(
    initialReason ? { kind: "unavailable", message: initialReason } : { kind: "form" },
  );
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
  const returnFocus = useRef<"review" | "amount" | "heading">("review");

  const hasPayment = outcome.kind === "recorded" || outcome.kind === "already_recorded";
  const title = hasPayment ? "Payment details" : "Record payment";
  const subtitle = hasPayment
    ? "The recorded payment for this job."
    : "Record the agreed payment for this job.";

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
    setValidated(true);
    setFormAlert(null);
    const nextErrors = validatePaymentForm({ method, amount }, acceptedSatang);
    setErrors(nextErrors);
    if (nextErrors.method) return firstMethod.current?.focus();
    if (nextErrors.amount) return amountInput.current?.focus();
    setDialogError(null);
    returnFocus.current = "review";
    setReviewing(true);
  }

  function closeDialog(focus: "review" | "amount" | "heading") {
    returnFocus.current = focus;
    setReviewing(false);
  }

  function confirm() {
    if (pending || !method) return;
    startTransition(async () => {
      const result = await recordJobPayment(job.job_id, method, amount.trim());
      switch (result.status) {
        case "recorded":
          closeDialog("heading");
          setOutcome({ kind: "recorded", payment: result.payment });
          setToast("The payment is saved as Paid for this job.");
          return;
        case "already_recorded":
          closeDialog("heading");
          setOutcome({ kind: "already_recorded", message: result.message });
          return;
        case "unavailable":
          closeDialog("heading");
          setOutcome({ kind: "unavailable", message: result.message });
          return;
        case "mismatch":
          closeDialog("amount");
          setErrors((current) => ({ ...current, amount: result.message }));
          setFormAlert(result.message);
          return;
        case "error":
          // Keep the dialog and the entered values so the Creator can retry or go back.
          setDialogError(result.message);
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

        {outcome.kind === "recorded" && (
          <PaymentRecordedView jobId={job.job_id} payment={outcome.payment} />
        )}
        {outcome.kind === "already_recorded" && (
          <PaymentRecordedView jobId={job.job_id} payment={null} message={outcome.message} />
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
              disabled={pending}
              className="mk-primary-button h-12 w-full text-sm font-bold text-white"
            >
              Review payment
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
          onClose={() => {
            if (!pending) closeDialog("review");
          }}
          finalFocus={finalFocus}
        />
      )}
    </section>
  );
}
