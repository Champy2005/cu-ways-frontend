import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError, getDisplayError } from "@/lib/api/errors";
import { loadJobOffersInitialData } from "@/features/jobs/api";
import { JobOffersWorkspace } from "@/features/jobs/components/job-offers-workspace";

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

  return <JobOffersWorkspace key={jobId} initialData={data} />;
}
