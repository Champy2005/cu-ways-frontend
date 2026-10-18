import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, UserPlus } from "lucide-react";

import { ApiError, getDisplayError } from "@/lib/api/errors";
import { loadJobOffersInitialData } from "@/features/jobs/api";
import { JobOffersCompare } from "@/features/jobs/components/job-offers-compare";
import type { JobOfferComparison } from "@/features/jobs/types";

export const metadata = { title: "Compare Offers | CU Ways" };

function JobUnavailable({ message }: { message: string }) {
  return (
    <div className="mx-auto w-full max-w-3xl text-[var(--mk-text)]">
      <div className="mk-error-notice rounded-xl p-5" role="alert">
        <p className="font-semibold">This job is not available</p>
        <p className="mt-1 text-sm">{message}</p>
        <Link
          href="/creator/dashboard"
          className="mk-secondary-button mt-4 inline-flex min-h-11 items-center justify-center px-4 text-sm font-medium"
        >
          Back to Creator workspace
        </Link>
      </div>
    </div>
  );
}

function jobAccessMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 401) {
    return "Your session expired. Sign in again to continue.";
  }
  if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
    return "This job may not exist or may belong to another Creator. Return to your dashboard to select your jobs.";
  }
  return getDisplayError(error);
}

export default async function CompareOffersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawJobId } = await params;
  if (!/^[1-9]\d*$/.test(rawJobId)) notFound();

  const jobId = Number(rawJobId);
  if (!Number.isSafeInteger(jobId) || jobId > 2_147_483_647) notFound();

  let data: Awaited<ReturnType<typeof loadJobOffersInitialData>>;
  try {
    data = await loadJobOffersInitialData(jobId);
  } catch (error) {
    return <JobUnavailable message={jobAccessMessage(error)} />;
  }

  const offers: JobOfferComparison[] = data.offers.status === "success" ? data.offers.items : [];
  const surveyTitles = data.job.surveys.map((survey) => survey.title);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 text-[var(--mk-text)]">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--mk-border)] pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/creator/dashboard"
            aria-label="Back to dashboard"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--mk-border)] bg-[var(--mk-surface)] text-[var(--mk-text)] shadow-[var(--mk-shadow)] outline-none hover:border-[var(--mk-accent)] focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">Compare Job Offers</h1>
            <p className="mt-0.5 text-sm text-[var(--mk-muted)]">
              Job #{data.job.job_id}
              {surveyTitles.length > 0 ? ` · ${surveyTitles.join(", ")}` : " · No linked surveys"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/creator/jobs/${jobId}/invite`}
            className="mk-secondary-button inline-flex min-h-9 items-center justify-center gap-1.5 px-3 text-xs font-semibold"
          >
            <UserPlus aria-hidden="true" className="size-3.5" />
            Invite marketers
          </Link>
          <span className="shrink-0 rounded-full border border-[var(--mk-border)] bg-[var(--mk-field)] px-2.5 py-1 text-xs font-medium text-[var(--mk-text)]">
            {data.job.job_status}
          </span>
        </div>
      </header>

      {/* Main Offers Comparison View */}
      <JobOffersCompare
        jobId={jobId}
        offers={offers}
        error={data.offers.status === "error" ? data.offers.message : undefined}
      />
    </div>
  );
}
