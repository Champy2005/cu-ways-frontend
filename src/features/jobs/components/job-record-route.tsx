import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError, getDisplayError } from "@/lib/api/errors";

/**
 * Route helpers shared by the job record pages (payment and review): parse
 * the job id from the URL and show a clear unavailable state when the job
 * is missing, belongs to another Creator, or the session expired.
 */

/** The job id from the route, or a 404 for anything that is not a valid id. */
export function parseJobRouteId(rawJobId: string): number {
  if (!/^[1-9]\d*$/.test(rawJobId)) notFound();
  const jobId = Number(rawJobId);
  if (!Number.isSafeInteger(jobId) || jobId > 2_147_483_647) notFound();
  return jobId;
}

function jobAccessMessage(error: unknown, ownerOnly: string): string {
  if (error instanceof ApiError && error.status === 401) {
    return "Your session expired. Sign in again to continue.";
  }
  if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
    return `This job may not exist or may belong to another Creator. ${ownerOnly}`;
  }
  return getDisplayError(error);
}

export function JobRecordUnavailable({ error, ownerOnly }: { error: unknown; ownerOnly: string }) {
  return (
    <div className="mx-auto w-full max-w-md text-[var(--mk-text)]">
      <div className="mk-error-notice rounded-xl p-5" role="alert">
        <p className="font-semibold">This job is not available</p>
        <p className="mt-1 text-sm">{jobAccessMessage(error, ownerOnly)}</p>
        <Link
          href="/creator/jobs"
          className="mk-secondary-button mt-4 inline-flex min-h-11 items-center justify-center border px-4 text-sm font-medium"
        >
          Back to my jobs
        </Link>
      </div>
    </div>
  );
}

export function JobRecordLoading({ message }: { message: string }) {
  return (
    <p role="status" className="mx-auto w-full max-w-md text-sm text-[var(--mk-muted)]">
      {message}
    </p>
  );
}
