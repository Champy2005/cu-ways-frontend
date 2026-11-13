"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseProjectBriefUrl } from "@/features/jobs/project-brief";
import { MutationControl } from "./mutation-control";
import { formatTHB } from "./format";
import type { PaymentInput, Settlement } from "./types";

const paymentMethods: PaymentInput["method"][] = ["PromptPay", "Bank Transfer", "Credit Card"];

export function RecordPayment({ job }: { job: Settlement }) {
  const [error, setError] = useState("");
  const methodRef = useRef<HTMLSelectElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const id = useId();

  return (
    <MutationControl jobId={job.job_id}>
      {(ask, disabled) => (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const method = paymentMethods.find((value) => value === form.get("method"));
            const amount = String(form.get("amount") ?? "").trim();
            if (!method) {
              setError("Choose a payment method.");
              methodRef.current?.focus();
              return;
            }
            if (
              !/^\d{1,8}(\.\d{1,2})?$/.test(amount) ||
              Number(amount) !== Number(job.accepted_price)
            ) {
              setError(`Enter the accepted price of ${formatTHB(job.accepted_price)}.`);
              amountRef.current?.focus();
              return;
            }
            setError("");
            ask({
              mutation: { kind: "payment", input: { method, amount } },
              title: "Record this payment?",
              description: `Record ${formatTHB(amount)} for ${job.marketer.name} by ${method}. The recorded payout will be held until job completion.`,
              confirmLabel: "Confirm record",
              success: "Payment recorded.",
            });
          }}
        >
          <label className="block space-y-1">
            <span>Payment method</span>
            <select
              ref={methodRef}
              name="method"
              defaultValue=""
              aria-describedby={error ? id : undefined}
              className="mk-input h-12 w-full rounded-lg border border-[var(--mk-border)] bg-[var(--mk-field)] px-3"
            >
              <option value="">Choose a method</option>
              {paymentMethods.map((method) => (
                <option key={method}>{method}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span>Amount (THB)</span>
            <Input
              ref={amountRef}
              name="amount"
              inputMode="decimal"
              aria-describedby={error ? id : undefined}
            />
          </label>
          {error && (
            <p id={id} role="alert" className="text-sm text-[var(--mk-error)]">
              {error}
            </p>
          )}
          <Button type="submit" className="mk-primary-button" disabled={disabled}>
            Review payment
          </Button>
        </form>
      )}
    </MutationControl>
  );
}

export function StartJob({ job }: { job: Settlement }) {
  return (
    <MutationControl jobId={job.job_id}>
      {(ask, disabled) => (
        <Button
          className="mk-primary-button"
          disabled={disabled}
          onClick={() =>
            ask({
              mutation: { kind: "start" },
              title: "Start this job?",
              description: "The job will move to In Progress and you can submit delivery proof.",
              confirmLabel: "Confirm start",
              success: "Job started.",
            })
          }
        >
          Start job
        </Button>
      )}
    </MutationControl>
  );
}

export function CompleteJob({ job }: { job: Settlement }) {
  return (
    <MutationControl jobId={job.job_id}>
      {(ask, disabled) => (
        <Button
          className="min-h-12 w-full bg-emerald-700 font-bold text-white hover:bg-emerald-800"
          disabled={disabled}
          onClick={() =>
            ask({
              mutation: { kind: "complete" },
              title: "Complete this job?",
              description: `Confirm that you reviewed the delivery proof. This completes the job and records the simulated release of ${formatTHB(job.accepted_price)}.`,
              confirmLabel: "Confirm completion",
              success: "Job completed. Payout recorded as Released.",
            })
          }
        >
          Complete job
        </Button>
      )}
    </MutationControl>
  );
}

export function SubmitProof({
  job,
  inputId,
}: {
  job: Pick<Settlement, "job_id">;
  inputId?: string;
}) {
  const [error, setError] = useState("");
  const urlRef = useRef<HTMLInputElement>(null);
  const id = useId();
  return (
    <MutationControl jobId={job.job_id}>
      {(ask, disabled) => (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const url = parseProjectBriefUrl(urlRef.current?.value ?? "");
            if (!url) {
              setError("Enter an absolute HTTP or HTTPS proof link.");
              urlRef.current?.focus();
              return;
            }
            setError("");
            ask({
              mutation: { kind: "proof", url },
              title: "Submit delivery proof?",
              description: url,
              confirmLabel: "Confirm proof",
              success: "Delivery proof saved.",
            });
          }}
        >
          <label className="block space-y-1">
            <span>Proof link</span>
            <Input
              ref={urlRef}
              id={inputId}
              name="url"
              inputMode="url"
              aria-describedby={error ? id : undefined}
            />
          </label>
          {error && (
            <p id={id} role="alert" className="text-sm text-[var(--mk-error)]">
              {error}
            </p>
          )}
          <Button type="submit" className="mk-primary-button" disabled={disabled}>
            Submit proof
          </Button>
        </form>
      )}
    </MutationControl>
  );
}

export function SubmitReview({ job }: { job: Settlement }) {
  const [rating, setRating] = useState(0);
  const [error, setError] = useState("");
  const firstStar = useRef<HTMLInputElement>(null);
  const id = useId();
  return (
    <MutationControl jobId={job.job_id}>
      {(ask, disabled) => (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (rating === 0) {
              setError("Choose a rating from 1 to 5 stars.");
              firstStar.current?.focus();
              return;
            }
            const comment = String(new FormData(event.currentTarget).get("comment") ?? "").trim();
            ask({
              mutation: { kind: "review", rating, comment },
              title: "Submit your review?",
              description: `${job.marketer.name} · ${rating} out of 5 stars. ${comment || "No written comment."} You can submit one review for this job.`,
              confirmLabel: "Submit review",
              success: "Review submitted.",
            });
          }}
        >
          <fieldset aria-describedby={error ? id : undefined}>
            <legend>Rating</legend>
            <div className="flex flex-wrap gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <label
                  key={star}
                  className="relative flex size-11 cursor-pointer items-center justify-center rounded focus-within:ring-2 focus-within:ring-[var(--mk-accent)]"
                >
                  <input
                    type="radio"
                    className="sr-only"
                    name="rating"
                    ref={star === 1 ? firstStar : undefined}
                    checked={rating === star}
                    onChange={() => {
                      setRating(star);
                      setError("");
                    }}
                  />
                  <span aria-hidden="true" className="text-2xl text-[var(--mk-action)]">
                    {rating >= star ? "★" : "☆"}
                  </span>
                  <span className="sr-only">
                    {star} {star === 1 ? "star" : "stars"}
                  </span>
                </label>
              ))}
            </div>
            {rating > 0 && <p>{rating} out of 5 stars</p>}
          </fieldset>
          {error && (
            <p id={id} role="alert" className="text-sm text-[var(--mk-error)]">
              {error}
            </p>
          )}
          <label className="block space-y-1">
            <span>Comment (optional)</span>
            <textarea
              name="comment"
              rows={4}
              className="w-full rounded-lg border border-[var(--mk-border)] bg-[var(--mk-field)] p-3"
            />
          </label>
          <Button type="submit" className="mk-primary-button" disabled={disabled}>
            Review &amp; submit
          </Button>
        </form>
      )}
    </MutationControl>
  );
}
