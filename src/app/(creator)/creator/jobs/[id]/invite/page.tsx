import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { StatusText } from "@/components/ui/status-text";

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
    <div className="mx-auto w-full max-w-5xl space-y-5 pb-24 text-[var(--mk-text)]">
      <header className="mb-5 flex items-center gap-3 border-b border-[var(--mk-border)] pb-4">
        <BackLink href={`/creator/jobs/${jobId}`} label="Back to job details" />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight">Invite Marketers</h1>
          <p className="mt-0.5 text-sm text-[var(--mk-muted)]">
            {data.job.title || `Job #${data.job.job_id}`}
            {surveyTitles.length > 0 ? ` · ${surveyTitles.join(", ")}` : " · No linked surveys"}
          </p>
        </div>
        <StatusText status={data.job.job_status} />
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
