"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreateJobForm } from "@/features/jobs/components/create-job-form";
import { JobCreatedView } from "@/features/jobs/components/job-created-view";
import { JobLinkedSurveys } from "@/features/jobs/components/job-linked-surveys";
import { JobProjectBrief } from "@/features/jobs/components/job-project-brief";
import { JobSurveySelector } from "@/features/jobs/components/job-survey-selector";
import type { JobSuccessNotice } from "@/features/jobs/components/job-success-notification";
import {
  addJobSurveys,
  loadSavedJob,
  removeJobSurvey,
  type SavedJobState,
} from "@/features/jobs/job-actions";
import { bangkokDate } from "@/features/job-invitations/format";
import { formatOfferPrice } from "@/features/jobs/format";
import {
  consumeJobCreatedNotice,
  consumeJobUpdatedNotice,
} from "@/features/jobs/job-creation-notice";

export function JobDraftPage({
  jobId,
  creatorName,
  edit = false,
}: {
  jobId: string;
  creatorName?: string;
  edit?: boolean;
}) {
  return (
    <SavedJobPage key={`${jobId}-${edit}`} jobId={jobId} creatorName={creatorName} edit={edit} />
  );
}

function SavedJobPage({
  jobId,
  creatorName,
  edit,
}: {
  jobId: string;
  creatorName?: string;
  edit: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<SavedJobState | { status: "loading" }>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [selectingSurveys, setSelectingSurveys] = useState(false);
  const [pending, setPending] = useState(false);
  const [notification, setNotification] = useState<JobSuccessNotice | null>(null);
  const busy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    let active = true;
    mounted.current = true;
    loadSavedJob(jobId)
      .then((result) => {
        if (!active) return;
        if (result.status === "success") {
          const created = consumeJobCreatedNotice(result.creatorId, result.job.job_id);
          const updated = consumeJobUpdatedNotice(result.creatorId, result.job.job_id);
          setNotification(created ? { kind: "created" } : updated ? { kind: "updated" } : null);
        }
        setState(result);
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

  async function changeSurveys(operation: () => Promise<SavedJobState>, notifyLinked = false) {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setNotification(null);
    try {
      const result = await operation();
      if (mounted.current) {
        setState(result);
        setSelectingSurveys(false);
        if (notifyLinked && result.status === "success" && !result.notice) {
          setNotification({ kind: "surveys-linked", count: result.job.surveys.length });
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
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
          values: {
            title: job.title ?? "",
            description: job.description ?? "",
            budget: job.budget ?? "",
            deadline: job.deadline?.slice(0, 10) ?? "",
          },
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
          key={jobId}
          job={{
            id: job.job_id,
            createdAt: job.created_at,
            title: job.title || `Job #${job.job_id}`,
            compensation: job.budget ? formatOfferPrice(job.budget) : "Not specified",
            deadline:
              job.effective_deadline || job.deadline
                ? bangkokDate((job.effective_deadline ?? job.deadline)!)
                : "",
            description: job.description,
            surveyCount: job.surveys.length,
            pendingOfferCount: job.pending_offer_count,
            status: job.job_status,
          }}
          canEdit={!pending && job.job_status === "Pending"}
          notification={notification}
          onDismissNotification={() => setNotification(null)}
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
        <JobProjectBrief
          jobId={jobId}
          creatorId={state.creatorId}
          creatorName={creatorName}
          onSaved={() => {
            setNotification({ kind: "brief-updated" });
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </div>
      {selectingSurveys && (
        <JobSurveySelector
          initialSelectedSurveyIds={[]}
          linkedSurveyIds={selectedIds}
          pending={pending}
          backLabel="Back to job details"
          onBack={() => setSelectingSurveys(false)}
          onSave={(surveyIds) => void changeSurveys(() => addJobSurveys(jobId, surveyIds), true)}
        />
      )}
    </div>
  );
}
