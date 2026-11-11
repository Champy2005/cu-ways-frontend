/**
 * User-facing copy for the error codes documented on POST /api/v1/jobs/{id}/proofs
 * (see `addJobProof` in src/lib/api/generated/backend.ts).
 */
export type ProofErrorKind =
  /** Fix the link in the form. */
  | "field"
  /** Keep the draft and let the marketer reopen the form. */
  | "rejected"
  /** The job state changed; refresh before adding proof. */
  | "job-changed"
  /** The marketer can no longer act on this job. */
  | "access"
  | "session";

export type ProofError = { kind: ProofErrorKind; title: string; body: string };

const proofErrors: Record<string, ProofError> = {
  invalid_proof_url: {
    kind: "field",
    title: "Check the link",
    body: "Enter a full link that starts with http:// or https://.",
  },
  invalid_attachment_type: {
    kind: "rejected",
    title: "Proof wasn’t saved",
    body: "The attachment type was rejected. Your link is kept so you can try again.",
  },
  validation_error: {
    kind: "rejected",
    title: "Proof wasn’t saved",
    body: "The link couldn’t be accepted. Check it and try again.",
  },
  job_not_in_progress: {
    kind: "job-changed",
    title: "This job may have changed",
    body: "Proof can only be added while the job is In Progress. Refresh the job before adding proof.",
  },
  accepted_offer_mismatch: {
    kind: "job-changed",
    title: "This job may have changed",
    body: "The accepted offer for this job has changed. Refresh the job before adding proof.",
  },
  forbidden: {
    kind: "access",
    title: "Job unavailable",
    body: "Your access to this job has changed.",
  },
  marketer_required: {
    kind: "access",
    title: "Job unavailable",
    body: "Only the hired marketer can add delivery proof.",
  },
  job_not_found: {
    kind: "access",
    title: "Job unavailable",
    body: "This job could not be found.",
  },
  invalid_job: {
    kind: "access",
    title: "Job unavailable",
    body: "This job could not be found.",
  },
  session_expired: {
    kind: "session",
    title: "Your session expired",
    body: "Sign in again to add proof. Your link is kept on this page.",
  },
  unauthorized: {
    kind: "session",
    title: "Your session expired",
    body: "Sign in again to add proof. Your link is kept on this page.",
  },
};

const fallback: ProofError = {
  kind: "rejected",
  title: "Proof wasn’t saved",
  body: "Something went wrong. Try again.",
};

export function describeProofError(code: string): ProofError {
  return proofErrors[code] ?? fallback;
}
