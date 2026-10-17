"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";

import { Card } from "@/components/ui/card";
import { CreateJobForm } from "@/features/jobs/components/create-job-form";
import { JobCreatedView } from "@/features/jobs/components/job-created-view";
import { parseJobDraft, readJobDraftSnapshot, subscribeJobDraft } from "@/features/jobs/job-draft";

const serverSnapshot = () => undefined;

export function JobDraftPage({
  jobId,
  edit = false,
  previewAccepted = false,
}: {
  jobId: string;
  edit?: boolean;
  previewAccepted?: boolean;
}) {
  const router = useRouter();
  const snapshot = useSyncExternalStore(
    subscribeJobDraft,
    () => readJobDraftSnapshot(jobId),
    serverSnapshot,
  );

  if (snapshot === undefined) {
    return (
      <p role="status" className="text-sm text-[var(--mk-muted)]">
        Loading job…
      </p>
    );
  }

  const draft = parseJobDraft(snapshot, jobId);
  if (!draft) {
    return (
      <Card className="mx-auto max-w-md gap-3 border border-[var(--mk-border)] bg-[var(--mk-surface)] p-5 text-[var(--mk-text)]">
        <h1 className="text-lg font-bold">Job preview not available</h1>
        <p className="text-sm text-[var(--mk-muted)]">
          This job preview is no longer available in this browser tab. Return to the form to create
          one.
        </p>
        <Link
          href="/creator/jobs/create"
          className="text-sm font-semibold text-[var(--mk-accent)] underline underline-offset-4"
        >
          Create a job
        </Link>
      </Card>
    );
  }

  if (edit) return <CreateJobForm initialDraft={draft} />;

  return (
    <JobCreatedView
      key={`${jobId}-${previewAccepted}`}
      job={{
        title: draft.values.title,
        compensation: draft.values.budget,
        deadline: draft.values.deadline,
        surveyCount: draft.selectedSurveyIds.length,
        status: previewAccepted ? "Accepted" : draft.status,
      }}
      onEdit={() => router.push(`/creator/jobs/create?edit=${encodeURIComponent(jobId)}`)}
    />
  );
}
