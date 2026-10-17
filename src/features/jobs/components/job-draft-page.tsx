"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreateJobForm } from "@/features/jobs/components/create-job-form";
import { JobCreatedView } from "@/features/jobs/components/job-created-view";
import { JobLinkedSurveys } from "@/features/jobs/components/job-linked-surveys";
import { JobSurveySelector } from "@/features/jobs/components/job-survey-selector";
import {
  addJobSurveys,
  loadSavedJob,
  removeJobSurvey,
  type SavedJobState,
} from "@/features/jobs/job-actions";
import { parseJobDraft, readJobDraftSnapshot, subscribeJobDraft } from "@/features/jobs/job-draft";

const serverSnapshot = () => null;

export function JobDraftPage({
  jobId,
  edit = false,
  previewAccepted = false,
}: {
  jobId: string;
  edit?: boolean;
  previewAccepted?: boolean;
}) {
  return (
    <SavedJobPage
      key={`${jobId}-${edit}`}
      jobId={jobId}
      edit={edit}
      previewAccepted={previewAccepted}
    />
  );
}

function SavedJobPage({
  jobId,
  edit,
  previewAccepted,
}: {
  jobId: string;
  edit: boolean;
  previewAccepted: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<SavedJobState | { status: "loading" }>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [selectingSurveys, setSelectingSurveys] = useState(false);
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const mounted = useRef(true);
  const creatorId = state.status === "success" ? state.creatorId : 0;
  const snapshot = useSyncExternalStore(
    subscribeJobDraft,
    () => readJobDraftSnapshot(jobId, creatorId),
    serverSnapshot,
  );
  useEffect(() => {
    let active = true;
    mounted.current = true;
    loadSavedJob(jobId)
      .then((result) => {
        if (active) setState(result);
      })
      .catch(() => {
        if (active)
          setState({ status: "error", message: "Your job could not be loaded. Please try again." });
      });
    return () => {
      active = false;
      mounted.current = false;
    };
  }, [jobId, attempt]);

  async function changeSurveys(operation: () => Promise<SavedJobState>) {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    try {
      const result = await operation();
      if (mounted.current) {
        setState(result);
        setSelectingSurveys(false);
      }
    } catch {
      if (mounted.current)
        setState({
          status: "error",
          message: "The change could not be confirmed. Reload the job to check its saved surveys.",
        });
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }

  if (state.status === "loading")
    return (
      <p role="status" className="text-sm text-[var(--mk-muted)]">
        Loading job…
      </p>
    );
  if (state.status === "error")
    return (
      <Card className="mx-auto max-w-md gap-3 border border-[var(--mk-border)] bg-[var(--mk-surface)] p-5 text-[var(--mk-text)]">
        <h1 className="text-lg font-bold">Job not available</h1>
        <p role="alert" className="text-sm text-[var(--mk-muted)]">
          {state.message}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setState({ status: "loading" });
            setAttempt((value) => value + 1);
          }}
        >
          Reload job
        </Button>
        <Link
          href="/creator/jobs/create"
          className="text-sm font-semibold text-[var(--mk-accent)] underline"
        >
          Create a job
        </Link>
      </Card>
    );

  const { job } = state;
  const cached = parseJobDraft(snapshot, jobId, state.creatorId);
  const selectedIds = job.surveys.map((survey) => String(survey.survey_id));
  const surveys = job.surveys.map((survey) => ({
    id: String(survey.survey_id),
    title: survey.title,
    targetResponses: null,
  }));
  if (edit && job.job_status === "Pending")
    return (
      <CreateJobForm
        initialDraft={{
          id: job.job_id,
          creatorId: state.creatorId,
          status: "Pending",
          surveys,
          values: cached?.values ?? { title: "", description: "", budget: "", deadline: "" },
          selectedSurveyIds: selectedIds,
        }}
      />
    );

  return (
    <div className="mx-auto w-full max-w-md" aria-busy={pending}>
      {state.notice && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {state.notice}
        </p>
      )}
      {pending && (
        <p role="status" className="mb-4 text-sm text-[var(--mk-muted)]">
          Saving survey changes…
        </p>
      )}
      <div hidden={selectingSurveys} className="space-y-6">
        <JobCreatedView
          key={`${jobId}-${previewAccepted}`}
          job={{
            id: job.job_id,
            title: cached?.values.title ?? `Job #${job.job_id}`,
            compensation: cached?.values.budget ?? "Not provided",
            deadline: cached?.values.deadline ?? "",
            surveyCount: job.surveys.length,
            status: previewAccepted ? "Accepted" : job.job_status,
          }}
          canEdit={!pending && job.job_status === "Pending"}
          onEdit={() => router.push(`/creator/jobs/create?edit=${job.job_id}`)}
        />
        <JobLinkedSurveys
          surveys={surveys}
          pending={pending}
          onAdd={() => {
            setSelectingSurveys(true);
            window.requestAnimationFrame(() =>
              document.getElementById("job-survey-search")?.focus(),
            );
          }}
          onRemove={(surveyId) => void changeSurveys(() => removeJobSurvey(jobId, surveyId))}
        />
      </div>
      {selectingSurveys && (
        <JobSurveySelector
          initialSelectedSurveyIds={[]}
          linkedSurveyIds={selectedIds}
          pending={pending}
          backLabel="Back to job details"
          onBack={() => setSelectingSurveys(false)}
          onSave={(surveyIds) => void changeSurveys(() => addJobSurveys(jobId, surveyIds))}
        />
      )}
    </div>
  );
}
