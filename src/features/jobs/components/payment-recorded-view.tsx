import { StatusText } from "@/components/ui/status-text";
import { bangkokDateTime } from "../format";
import { formatSatang, toSatang, type ActivePayment } from "../payment";
import { BackToJobLink, RecordNote } from "./record-page-parts";

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
        <time dateTime={value}>{bangkokDateTime(value)}</time>
      </dd>
    </div>
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
      <div className="mt-4">
        <RecordNote>
          {pending
            ? "This payment is not confirmed as Paid yet. A new payment cannot be recorded while it is pending."
            : "The method and amount cannot be edited here. No money is collected or transferred."}
        </RecordNote>
      </div>
      <BackToJobLink jobId={jobId} />
    </section>
  );
}
