import Link from "next/link";
import { Info } from "lucide-react";
import { StatusText } from "@/components/ui/status-text";
import { formatSatang, toSatang, type RecordedPayment } from "../payment";

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

/**
 * Read-only record. `payment` is null when the backend reported an existing
 * payment (409) but this page has no endpoint to read its details.
 */
export function PaymentRecordedView({
  jobId,
  payment,
  message,
}: {
  jobId: number;
  payment: RecordedPayment | null;
  message?: string;
}) {
  const satang = payment ? toSatang(payment.amount) : null;
  return (
    <section className="pay-card" aria-labelledby="payment-record-heading">
      <div className="flex items-center justify-between gap-3">
        <h2 id="payment-record-heading" className="pay-section-title">
          {payment ? "Payment recorded" : "Payment already recorded"}
        </h2>
        <StatusText status="Paid" />
      </div>
      {payment ? (
        <>
          <p className="pay-amount">{satang === null ? payment.amount : formatSatang(satang)}</p>
          <dl className="pay-details mt-3 border-t border-[var(--mk-border)] pt-3">
            <div>
              <dt>Payment method</dt>
              <dd>{payment.method}</dd>
            </div>
            <div>
              <dt>Recorded on</dt>
              <dd>
                <time dateTime={payment.paid_at}>{bangkokTime(payment.paid_at)}</time>
              </dd>
            </div>
            <div>
              <dt>Payment ID</dt>
              <dd>#{payment.payment_id}</dd>
            </div>
          </dl>
        </>
      ) : (
        <p className="mt-2 text-sm text-[var(--mk-muted)]">{message}</p>
      )}
      <p className="pay-note mt-4">
        <Info aria-hidden="true" />
        <span>
          The method and amount cannot be edited here. No money is collected or transferred.
        </span>
      </p>
      <Link
        href={`/creator/jobs/${jobId}`}
        className="mk-secondary-button mt-4 inline-flex min-h-12 w-full items-center justify-center border px-4 text-sm font-bold"
      >
        Back to job details
      </Link>
    </section>
  );
}
