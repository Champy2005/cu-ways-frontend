import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ApiError, getDisplayError } from "@/lib/api/errors";
import { SEARCH_PAGE_SIZE } from "@/features/marketer-discovery/constants";
import { loadJobInviteInitialData } from "@/features/jobs/api";
import { JobInviteSelector } from "@/features/jobs/components/job-invite-selector";
import type { JobInviteMarketer } from "@/features/jobs/types";

export const metadata = { title: "Invite marketers | CU Ways" };

function JobUnavailable({ message }: { message: string }) {
  return (
    <div className="mx-auto w-full max-w-3xl text-[var(--mk-text)]">
      <div className="mk-error-notice rounded-xl p-5" role="alert">
        <p className="font-semibold">This job is not available</p>
        <p className="mt-1 text-sm">{message}</p>
        <Link
          href="/creator/jobs/invite"
          className="mk-secondary-button mt-4 inline-flex min-h-11 items-center justify-center px-4 text-sm font-medium"
        >
          Back to job selection
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
    return "This job may not exist or may belong to another Creator. Select one of your jobs to continue.";
  }
  return getDisplayError(error);
}

export default async function InviteMarketersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawJobId } = await params;
  if (!/^[1-9]\d*$/.test(rawJobId)) notFound();

  const jobId = Number(rawJobId);
  if (!Number.isSafeInteger(jobId) || jobId > 2_147_483_647) notFound();

  let data: Awaited<ReturnType<typeof loadJobInviteInitialData>>;
  try {
    data = await loadJobInviteInitialData(jobId);
  } catch (error) {
    return <JobUnavailable message={jobAccessMessage(error)} />;
  }

  const marketers: JobInviteMarketer[] =
    data.marketers.status === "success" ? data.marketers.items : [];
  const surveyTitles = data.job.surveys.map((survey) => survey.title);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 text-[var(--mk-text)]">
      <header className="mb-5 flex items-center gap-3 border-b border-[var(--mk-border)] pb-4">
        <Link
          href={`/creator/jobs/${jobId}`}
          aria-label="Back to job details"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--mk-border)] bg-[var(--mk-surface)] text-[var(--mk-text)] shadow-[var(--mk-shadow)] outline-none hover:border-[var(--mk-accent)] focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight">Invite Marketers</h1>
          <p className="mt-0.5 text-sm text-[var(--mk-muted)]">
            {data.job.title || `Job #${data.job.job_id}`}
            {surveyTitles.length > 0 ? ` · ${surveyTitles.join(", ")}` : " · No linked surveys"}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-[var(--mk-border)] bg-[var(--mk-field)] px-2.5 py-1 text-xs font-medium text-[var(--mk-text)]">
          {data.job.job_status}
        </span>
      </header>

      <JobInviteSelector
        jobId={jobId}
        jobStatus={data.job.job_status}
        marketers={marketers}
        totalMarketers={data.marketers.status === "success" ? data.marketers.total : 0}
        pageSize={data.marketers.status === "success" ? data.marketers.pageSize : SEARCH_PAGE_SIZE}
        marketersError={data.marketers.status === "error" ? data.marketers.message : undefined}
        sentInvitations={data.invitations.status === "success" ? data.invitations.items : []}
        sentInvitationsFresh={data.invitations.status === "success"}
        sentInvitationsError={
          data.invitations.status === "error" ? data.invitations.message : undefined
        }
      />
    </div>
  );
}
