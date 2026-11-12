import Link from "next/link";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusText } from "@/components/ui/status-text";
import { formatSatang, toSatang, type ActivePayment } from "../payment";

function bangkokTime(value: string): string {
  return `${new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value))} (Bangkok)`;
}

function PaymentTime({ payment }: { payment: ActivePayment }) {
  const [label, value] = payment.paid_at
    ? ["Recorded on", payment.paid_at]
    : payment.created_at
      ? ["Created on", payment.created_at]
      : [null, null];
  if (!label || !value) return null;
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        <time dateTime={value}>{bangkokTime(value)}</time>
      </dd>
    </div>
  );
}

function BackToJob({ jobId }: { jobId: number }) {
  return (
    <Link
      href={`/creator/jobs/${jobId}`}
      className="mk-secondary-button mt-4 inline-flex min-h-12 w-full items-center justify-center border px-4 text-sm font-bold"
    >
      Back to job details
    </Link>
  );
}

/**
 * Read-only record of the payment the backend holds for this job. The status
 * shown is always the backend's own (Paid or Pending), never assumed.
 */
export function PaymentRecordedView({
  jobId,
  payment,
  notice,
}: {
  jobId: number;
  payment: ActivePayment;
  notice?: string;
}) {
  const satang = toSatang(payment.amount);
  const pending = payment.payment_status === "Pending";
  return (
    <section className="pay-card" aria-labelledby="payment-record-heading">
      <div className="flex items-center justify-between gap-3">
        <h2 id="payment-record-heading" className="pay-section-title">
          {pending ? "Payment pending" : "Payment recorded"}
        </h2>
        <StatusText status={payment.payment_status} />
      </div>
      {notice && <p className="mt-2 text-sm text-[var(--mk-muted)]">{notice}</p>}
      <p className="pay-amount">{satang === null ? payment.amount : formatSatang(satang)}</p>
      <dl className="pay-details mt-3 border-t border-[var(--mk-border)] pt-3">
        <div>
          <dt>Payment method</dt>
          <dd>{payment.method}</dd>
        </div>
        <PaymentTime payment={payment} />
        <div>
          <dt>Payment ID</dt>
          <dd>#{payment.payment_id}</dd>
        </div>
      </dl>
      <p className="pay-note mt-4">
        <Info aria-hidden="true" />
        <span>
          {pending
            ? "This payment is not confirmed as Paid yet. A new payment cannot be recorded while it is pending."
            : "The method and amount cannot be edited here. No money is collected or transferred."}
        </span>
      </p>
      <BackToJob jobId={jobId} />
    </section>
  );
}

/**
 * The backend said a payment exists (or a request had an unknown result) but
 * its details could not be read. Nothing is claimed about its status.
 */
export function PaymentStatusUnknownView({
  jobId,
  title,
  message,
  checking,
  onCheck,
}: {
  jobId: number;
  title: string;
  message: string;
  checking: boolean;
  onCheck: () => void;
}) {
  return (
    <section className="pay-card" aria-labelledby="payment-unknown-heading">
      <h2 id="payment-unknown-heading" className="pay-section-title">
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
        {checking ? "Checking…" : "Check payment status"}
      </Button>
      <BackToJob jobId={jobId} />
    </section>
  );
}
