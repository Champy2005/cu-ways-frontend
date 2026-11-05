import Link from "next/link";
import { BackLink } from "@/components/ui/back-link";
import { StatusText } from "@/components/ui/status-text";
import { formatDate } from "@/features/job-invitations/format";
import { parseProjectBriefUrl } from "@/features/jobs/project-brief";
import { ApiError } from "@/lib/api/errors";
import { requireSession } from "@/lib/auth/guards";
import { formatTHB } from "./format";
import { RetryButton } from "./history-controls";
import { MutationFeedback } from "./mutation-control";
import { getJobWorkflow, getPayment, getReview } from "./queries";
import type { Proof, Settlement, Workspace } from "./types";
import {
  CompleteJob,
  RecordPayment,
  StartJob,
  SubmitProof,
  SubmitReview,
} from "./workflow-controls";

const jobTitle = (job: Settlement) => job.job_title || `Job #${job.job_id}`;

export function WorkflowError({ error }: { error: unknown }) {
  const status = error instanceof ApiError ? error.status : 0;
  const expired = status === 401;
  const unavailable = [403, 404, 409, 422].includes(status);
  return (
    <section className="mk-card space-y-3 p-5" role="alert">
      <h2 className="font-semibold">Job information unavailable</h2>
      <p>
        {expired
          ? "Your session expired. Sign in again to continue."
          : unavailable
            ? error instanceof ApiError && error.message
            : "Job information could not be loaded."}
      </p>
      {expired ? (
        <Link href="/login" className="underline">
          Sign in
        </Link>
      ) : (
        !unavailable && <RetryButton />
      )}
    </section>
  );
}

function WorkflowHeading({
  heading,
  job,
  backHref,
  backLabel,
}: {
  heading: string;
  job: Settlement;
  backHref: string;
  backLabel: string;
}) {
  return (
    <header className="space-y-2">
      <BackLink href={backHref} label={backLabel} />
      <h1 className="mk-page-title">{heading}</h1>
      <p className="text-[var(--mk-muted)] wrap-anywhere">
        {jobTitle(job)} · Job #{job.job_id}
      </p>
      <StatusText status={job.job_status} />
    </header>
  );
}

function ProofList({ proofs }: { proofs: Proof[] }) {
  if (proofs.length === 0)
    return <p className="text-sm text-[var(--mk-muted)]">No delivery proof has been submitted.</p>;
  return (
    <ul className="space-y-2">
      {proofs.map((proof) => {
        const url = parseProjectBriefUrl(proof.url);
        return (
          <li key={proof.attachment_id} className="flex flex-wrap items-center gap-x-4">
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center underline"
              >
                Open delivery proof <span className="sr-only">(new tab)</span>
              </a>
            ) : (
              <span>Proof link unavailable</span>
            )}
            <time className="text-sm text-[var(--mk-muted)]" dateTime={proof.upload_at}>
              {formatDate(proof.upload_at)}
            </time>
          </li>
        );
      })}
    </ul>
  );
}

export function CreatorWorkflow({ job, proofs }: { job: Settlement; proofs: Proof[] }) {
  const completed = job.job_status === "Completed";
  const inProgress = job.job_status === "In Progress";
  const paidAgreedAmount = job.payment?.amount === job.accepted_price;
  return (
    <section className="mk-card mx-auto mt-5 w-full max-w-4xl space-y-4 p-5">
      <h2 className="text-lg font-semibold">Payment and delivery</h2>
      <div className="flex flex-wrap gap-x-5">
        <Link
          className="inline-flex min-h-12 items-center underline"
          href={`/creator/jobs/${job.job_id}/payment`}
        >
          {job.payment ? "View payment" : "Record payment"}
        </Link>
        {completed && (
          <Link
            className="inline-flex min-h-12 items-center underline"
            href="/creator/transactions"
          >
            Transactions
          </Link>
        )}
      </div>
      <div>
        <h3 className="font-semibold">Delivery proof</h3>
        <ProofList proofs={proofs} />
      </div>
      {inProgress &&
        (paidAgreedAmount && proofs.length > 0 ? (
          <CompleteJob job={job} />
        ) : (
          <p className="text-sm text-[var(--mk-muted)]">
            Completion requires a recorded payment for the agreed price and delivery proof.
          </p>
        ))}
      {completed && (
        <p className="text-sm">
          Job completed.
          {job.payment && (
            <>
              {" "}
              Payout <StatusText status="Released" />.
            </>
          )}
        </p>
      )}
    </section>
  );
}

export async function MarketerJobPage({ id }: { id: string }) {
  const session = await requireSession();
  let workflow;
  try {
    workflow = await getJobWorkflow(id, session.userId, "marketer");
  } catch (error) {
    return <WorkflowError error={error} />;
  }
  const { job, proofs } = workflow;
  return (
    <section className="mx-auto w-full max-w-3xl space-y-5">
      <WorkflowHeading
        heading="Job details"
        job={job}
        backHref="/marketer/offers"
        backLabel="Back to My Offers"
      />
      <MutationFeedback>
        <div className="mk-card space-y-4 p-5">
          <p>Creator · {job.creator.name}</p>
          <p>Accepted price · {formatTHB(job.accepted_price)}</p>
          <Link
            className="inline-flex min-h-12 items-center underline"
            href={`/marketer/jobs/${id}/payment`}
          >
            View payment
          </Link>
          {job.job_status === "Accepted" && (
            <div>
              <StartJob job={job} />
            </div>
          )}
        </div>
        <div className="mk-card space-y-3 p-5">
          <h2 className="font-semibold">Delivery proof</h2>
          <ProofList proofs={proofs} />
          {job.job_status === "In Progress" && <SubmitProof job={job} />}
        </div>
      </MutationFeedback>
    </section>
  );
}

export async function PaymentPage({ id, workspace }: { id: string; workspace: Workspace }) {
  const session = await requireSession();
  let job;
  try {
    job = await getPayment(id);
    if (job[workspace].user_id !== session.userId) {
      throw new ApiError(404, "job_not_found", "This job is unavailable in this workspace.");
    }
  } catch (error) {
    return <WorkflowError error={error} />;
  }
  return (
    <section className="mx-auto w-full max-w-2xl space-y-5">
      <WorkflowHeading
        heading={job.payment ? "Payment details" : "Payment"}
        job={job}
        backHref={`/${workspace}/jobs/${id}`}
        backLabel="Back to job details"
      />
      <MutationFeedback>
        <div className="mk-card space-y-4 p-5">
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt>Creator</dt>
              <dd className="wrap-anywhere">{job.creator.name}</dd>
            </div>
            <div>
              <dt>Marketer</dt>
              <dd className="wrap-anywhere">{job.marketer.name}</dd>
            </div>
            <div>
              <dt>Accepted price</dt>
              <dd>{formatTHB(job.accepted_price)}</dd>
            </div>
          </dl>
          {job.payment ? (
            <dl className="grid grid-cols-2 gap-4 border-t border-[var(--mk-border)] pt-4">
              <div>
                <dt>Payment method</dt>
                <dd>{job.payment.method}</dd>
              </div>
              <div>
                <dt>Amount recorded</dt>
                <dd>{formatTHB(job.payment.amount)}</dd>
              </div>
              <div>
                <dt>Payment status</dt>
                <dd>
                  <StatusText status={job.payment.payment_status} />
                </dd>
              </div>
              <div>
                <dt>Marketer payout</dt>
                <dd>{job.payout_status && <StatusText status={job.payout_status} />}</dd>
              </div>
              <div>
                <dt>Payment recorded</dt>
                <dd>
                  {job.payment.paid_at ? formatDate(job.payment.paid_at) : "Date unavailable"}
                </dd>
              </div>
              {job.payout_status === "Released" && (
                <div>
                  <dt>Release recorded</dt>
                  <dd>{job.completed_at ? formatDate(job.completed_at) : "Date unavailable"}</dd>
                </div>
              )}
            </dl>
          ) : workspace === "creator" &&
            ["Accepted", "In Progress", "Completed"].includes(job.job_status) ? (
            <RecordPayment job={job} />
          ) : (
            <p>No payment has been recorded for this job.</p>
          )}
          <p className="text-sm text-[var(--mk-muted)]">
            CU Ways records the payment and payout status. Funds move outside the platform.
          </p>
          {job.job_status === "Completed" && job.payment && (
            <Link
              href={`/${workspace}/transactions`}
              className="inline-flex min-h-12 items-center underline"
            >
              Transactions
            </Link>
          )}
        </div>
      </MutationFeedback>
    </section>
  );
}

export async function ReviewPage({ id }: { id: string }) {
  await requireSession();
  let saved;
  try {
    saved = await Promise.all([getReview(id), getPayment(id)]);
  } catch (error) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <BackLink href={`/creator/jobs/${encodeURIComponent(id)}`} label="Back to job details" />
        <WorkflowError error={error} />
      </div>
    );
  }
  const [{ review }, job] = saved;
  return (
    <section className="mx-auto w-full max-w-2xl space-y-5">
      <WorkflowHeading
        heading={review ? "Your review" : "Write a review"}
        job={job}
        backHref={`/creator/jobs/${id}`}
        backLabel="Back to job details"
      />
      <MutationFeedback>
        <div className="mk-card space-y-4 p-5">
          <h2 className="font-semibold wrap-anywhere">{job.marketer.name}</h2>
          {review ? (
            <>
              <p>{review.rating} out of 5 stars</p>
              <p className="whitespace-pre-wrap wrap-anywhere">
                {review.comment || "No written comment."}
              </p>
              <time dateTime={review.created_at} className="text-sm text-[var(--mk-muted)]">
                {formatDate(review.created_at)}
              </time>
            </>
          ) : (
            <SubmitReview job={job} />
          )}
        </div>
      </MutationFeedback>
      <Link href="/creator/transactions" className="inline-flex min-h-12 items-center underline">
        Transactions
      </Link>
    </section>
  );
}
