import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getDisplayError } from "@/lib/api/errors";
import { listMarketers } from "@/features/marketer-discovery/api";
import { SEARCH_PAGE_SIZE } from "@/features/marketer-discovery/constants";
import { EMPTY_MARKETER_QUERY } from "@/features/marketer-discovery/schemas";
import { JobInviteSelector } from "@/features/jobs/components/job-invite-selector";
import type { JobInviteMarketer } from "@/features/jobs/types";

export const metadata = { title: "Invite marketers | CU Ways" };

export default async function InviteMarketersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawJobId } = await params;
  if (!/^[1-9]\d*$/.test(rawJobId)) notFound();

  const jobId = Number(rawJobId);
  if (!Number.isSafeInteger(jobId) || jobId > 2_147_483_647) notFound();

  let marketers: JobInviteMarketer[];
  let totalMarketers: number;
  try {
    const result = await listMarketers(EMPTY_MARKETER_QUERY);
    marketers = result.items.map((marketer) => ({
      marketer_id: marketer.marketer_id,
      display_name: marketer.display_name,
      headline: marketer.headline,
      average_rating: marketer.average_rating,
      rating_count: marketer.rating_count,
    }));
    totalMarketers = result.total;
  } catch (error) {
    return (
      <div className="mk-error-notice mx-auto max-w-3xl rounded-xl p-4" role="alert">
        <p className="font-semibold">Marketers could not be loaded</p>
        <p className="mt-1 text-sm">{getDisplayError(error)}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl text-[var(--mk-text)]">
      <div className="mb-5 flex items-center gap-3 border-b border-[var(--mk-border)] pb-4">
        <Link
          href={`/creator/jobs/invite?job_id=${jobId}&edit=1`}
          aria-label="Back to job selection"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--mk-border)] bg-[var(--mk-surface)] text-[var(--mk-text)] shadow-[var(--mk-shadow)] outline-none hover:border-[var(--mk-accent)] focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--mk-text)]">
            Invite Marketers
          </h1>
          <p className="mt-0.5 text-sm text-[var(--mk-muted)]">Job #{jobId}</p>
        </div>
      </div>
      <JobInviteSelector
        jobId={jobId}
        marketers={marketers}
        totalMarketers={totalMarketers}
        pageSize={SEARCH_PAGE_SIZE}
      />
    </div>
  );
}
