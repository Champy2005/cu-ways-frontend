"use client";

import { useRef, useState, type FormEvent } from "react";
import { SuccessToast } from "@/components/feedback/success-toast";
import type { JobPaymentData } from "../api";
import {
  PAYABLE_JOB_STATUSES,
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
import { PaymentRecordedView } from "./payment-recorded-view";
import {
  FormAlert,
  JobSummaryCard,
  RecordNote,
  RecordPageHeader,
  RecordStatusUnknownView,
  RecordSubmitButton,
  RecordUnavailableCard,
} from "./record-page-parts";
import { useConfirmedSave } from "./use-confirmed-save";

type Outcome =
  | { kind: "form" }
  | { kind: "payment"; payment: ActivePayment; notice?: string }
  | { kind: "unknown"; title: string; message: string }
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

/** A payment the backend already holds always wins over showing the form again. */
function initialOutcome(data: JobPaymentData): Outcome {
  if (data.currentPayment) return { kind: "payment", payment: data.currentPayment };
  const reason = unavailableReason(data);
  return reason ? { kind: "unavailable", message: reason } : { kind: "form" };
}

export function JobPaymentPage({ data }: { data: JobPaymentData }) {
  const { job, acceptedOffer } = data;
  const acceptedSatang = acceptedOffer ? (toSatang(acceptedOffer.offered_price) ?? 0) : 0;

  const amountInput = useRef<HTMLInputElement>(null);
  const firstMethod = useRef<HTMLInputElement>(null);
  const save = useConfirmedSave<Outcome>(() => initialOutcome(data), amountInput);
  const { outcome, pending } = save;
  const [method, setMethod] = useState<PaymentMethod | "">("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<PaymentFormErrors>({});
  const [validated, setValidated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const hasPayment = outcome.kind === "payment" || outcome.kind === "unknown";

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
    save.setFormAlert(null);
    const nextErrors = validatePaymentForm({ method, amount }, acceptedSatang);
    setErrors(nextErrors);
    if (nextErrors.method) return firstMethod.current?.focus();
    if (nextErrors.amount) return amountInput.current?.focus();
    save.openDialog();
  }

  function applyResult(result: RecordPaymentResult) {
    switch (result.status) {
      case "recorded":
        save.settle({ kind: "payment", payment: result.payment });
        setToast("The payment is saved as Paid for this job.");
        return;
      case "existing":
        save.settle({ kind: "payment", payment: result.payment, notice: result.message });
        return;
      case "existing_unconfirmed":
        save.settle({ kind: "unknown", title: "Payment already exists", message: result.message });
        return;
      case "unknown":
        save.settle({ kind: "unknown", title: "Payment status unknown", message: result.message });
        return;
      case "unavailable":
        save.settle({ kind: "unavailable", message: result.message });
        return;
      case "mismatch":
        setErrors((current) => ({ ...current, amount: result.message }));
        save.returnToField(result.message);
        return;
      case "error":
        // Keep the entered values so the Creator can retry or go back.
        save.showError(result.message);
    }
  }

  function confirm() {
    if (!method) return;
    save.run(async () => {
      applyResult(await recordJobPayment(job.job_id, method, amount.trim()));
    });
  }

  function checkStatus() {
    save.run(async () => {
      const result = await checkJobPayment(job.job_id);
      if (result.status === "found") {
        save.settle({ kind: "payment", payment: result.payment });
      } else if (result.status === "none") {
        const reason = unavailableReason(data);
        save.settle(reason ? { kind: "unavailable", message: reason } : { kind: "form" });
        if (!reason)
          save.setFormAlert("No payment is recorded for this job yet. You can submit it now.");
      } else {
        save.setOutcome((current) =>
          current.kind === "unknown" ? { ...current, message: result.message } : current,
        );
      }
    });
  }

  return (
    <section aria-labelledby="record-heading" className="mx-auto w-full max-w-md">
      <RecordPageHeader
        jobId={job.job_id}
        headingRef={save.heading}
        title={hasPayment ? "Payment details" : "Record payment"}
        subtitle={
          hasPayment
            ? "The payment recorded for this job."
            : "Record the agreed payment for this job."
        }
      />

      <SuccessToast title="Payment recorded" message={toast} onDismiss={() => setToast(null)} />

      <div className="space-y-4">
        <JobSummaryCard job={job} acceptedOffer={acceptedOffer} />

        {outcome.kind === "unavailable" && (
          <RecordUnavailableCard
            jobId={job.job_id}
            title="Payment is not available"
            message={outcome.message}
          />
        )}
        {outcome.kind === "payment" && (
          <PaymentRecordedView
            jobId={job.job_id}
            payment={outcome.payment}
            notice={outcome.notice}
          />
        )}
        {outcome.kind === "unknown" && (
          <RecordStatusUnknownView
            jobId={job.job_id}
            title={outcome.title}
            message={outcome.message}
            checkLabel="Check payment status"
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
            <FormAlert message={save.formAlert} />
            {pending && !save.confirming && (
              <RecordNote role="status">
                Still recording this payment. This page updates when it finishes, and the payment
                will not be recorded twice.
              </RecordNote>
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
                save.setFormAlert(null);
                revalidate({ amount: next });
              }}
            />
            <RecordNote>
              This records a payment only. No money is collected or transferred.
            </RecordNote>
            <RecordSubmitButton
              buttonRef={save.submitButton}
              pending={pending}
              pendingLabel="Recording…"
            >
              Review payment
            </RecordSubmitButton>
          </form>
        )}
      </div>

      {save.confirming && method && acceptedOffer && (
        <PaymentConfirmDialog
          marketerName={acceptedOffer.marketer.name}
          method={method}
          amountSatang={toSatang(amount) ?? 0}
          pending={pending}
          error={save.dialogError}
          onConfirm={confirm}
          onClose={() => save.closeDialog()}
          finalFocus={save.finalFocus}
        />
      )}
    </section>
  );
}
