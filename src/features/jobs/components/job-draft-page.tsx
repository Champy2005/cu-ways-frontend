"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

import { Card } from "@/components/ui/card";
import { CreateJobForm } from "@/features/jobs/components/create-job-form";
import { JobCreatedView } from "@/features/jobs/components/job-created-view";
import { JobLinkedSurveys } from "@/features/jobs/components/job-linked-surveys";
import { JobSurveySelector } from "@/features/jobs/components/job-survey-selector";
import {
  parseJobDraft,
  readJobDraftSnapshot,
  saveJobDraft,
  subscribeJobDraft,
} from "@/features/jobs/job-draft";
import { MOCK_JOB_SURVEYS, MOCK_JOB_SURVEY_LINKED_ON } from "@/features/jobs/mock-job-surveys";

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
  const [selectingSurveys, setSelectingSurveys] = useState(false);
  const [surveyError, setSurveyError] = useState<string | null>(null);
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

  const linkedSurveys = draft.selectedSurveyIds.map((id) => ({
    id,
    title: MOCK_JOB_SURVEYS.find((survey) => survey.id === id)?.title ?? id,
    linkedOn: MOCK_JOB_SURVEY_LINKED_ON,
  }));

  function saveSurveys(surveyIds: string[]) {
    if (!draft || surveyIds.length === 0) return;
    try {
      saveJobDraft(draft.values, surveyIds, draft.id);
      setSurveyError(null);
      setSelectingSurveys(false);
    } catch {
      setSurveyError("Your survey changes could not be saved. Please try again.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      {surveyError && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {surveyError}
        </p>
      )}
      <div hidden={selectingSurveys} className="space-y-6">
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
        <JobLinkedSurveys
          surveys={linkedSurveys}
          onAdd={() => {
            setSurveyError(null);
            setSelectingSurveys(true);
            // Move focus after the confirmation dialog releases its focus trap.
            window.requestAnimationFrame(() => {
              document.getElementById("job-survey-search")?.focus();
            });
          }}
          onRemove={(surveyId) =>
            saveSurveys(draft.selectedSurveyIds.filter((id) => id !== surveyId))
          }
        />
      </div>
      {selectingSurveys && (
        <JobSurveySelector
          surveys={MOCK_JOB_SURVEYS}
          initialSelectedSurveyIds={[]}
          linkedSurveyIds={draft.selectedSurveyIds}
          backLabel="Back to job details"
          onBack={() => {
            setSurveyError(null);
            setSelectingSurveys(false);
          }}
          onSave={saveSurveys}
        />
      )}
    </div>
  );
}
