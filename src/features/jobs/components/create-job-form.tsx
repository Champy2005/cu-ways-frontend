"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, CircleAlert, Clipboard, X } from "lucide-react";
import { useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { JobSurveySelector } from "@/features/jobs/components/job-survey-selector";
import { createPendingJob, saveJobDetails } from "@/features/jobs/job-actions";
import { markJobCreated, markJobUpdated } from "@/features/jobs/job-creation-notice";
import { type JobDraft } from "@/features/jobs/job-draft";
import { surveyDisplayId } from "@/features/jobs/survey-options";
import {
  createJobFieldErrors,
  type CreateJobFieldErrors,
  type CreateJobValues,
} from "@/features/jobs/schemas";
import type { JobSurveyOption } from "@/features/jobs/types";
import { cn } from "@/lib/utils";
import styles from "./create-job-form.module.css";

const fieldClassName =
  "h-[42px] rounded-xl border-transparent bg-[var(--mk-field)] px-3 text-sm text-[var(--mk-text)] shadow-[var(--mk-shadow)] placeholder:text-[var(--mk-muted)] aria-invalid:ring-0 md:text-sm";

function JobFormField({
  id,
  label,
  required = false,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className={cn(
          "block text-xs font-medium",
          error ? "text-destructive" : "text-[var(--mk-text)]",
        )}
      >
        {label} {required && <span aria-hidden="true">*</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-[11px] leading-4 text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function JobValidationAlert({ onDismiss, message }: { onDismiss: () => void; message?: string }) {
  return (
    <div
      role="alert"
      className="flex items-center gap-2.5 rounded-[14px] border border-destructive bg-destructive/5 p-3 shadow-card"
    >
      <CircleAlert aria-hidden="true" className="size-4 shrink-0 text-destructive" />
      <div className="min-w-0 flex-1 text-xs text-[var(--mk-text)]">
        <p className="font-bold">Job could not be created</p>
        <p className="mt-0.5 text-[11px] leading-4">
          {message ??
            "Review the highlighted required fields. Your entered values remain on this form."}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Dismiss validation alert"
        onClick={onDismiss}
        className="-mr-1 shrink-0 text-[var(--mk-muted)]"
      >
        <X aria-hidden="true" className="size-3" />
      </Button>
    </div>
  );
}

function JobSurveySummary({
  surveys,
  error,
  onEdit,
}: {
  surveys: readonly JobSurveyOption[];
  error?: string;
  onEdit: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <div
        role="group"
        aria-label="Selected surveys"
        aria-describedby={error ? "job-surveys-error" : undefined}
        className={cn(
          "flex min-h-14 items-center gap-3 rounded-xl border border-transparent bg-[var(--mk-field)] px-3 py-2 shadow-[var(--mk-shadow)]",
          error && "border-destructive",
        )}
      >
        <Clipboard
          aria-hidden="true"
          className={cn("size-5 shrink-0 text-[var(--mk-accent)]", error && "text-destructive")}
        />
        <div aria-live="polite" className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[var(--mk-text)]">
            {error
              ? "Select surveys *"
              : `${surveys.length} ${surveys.length === 1 ? "survey" : "surveys"} selected`}
          </p>
          <p className="mt-0.5 truncate text-xs text-[var(--mk-muted)]">
            {surveys.length > 0
              ? surveys.map((survey) => survey.title).join(", ")
              : "No survey selected"}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          aria-label="Edit selected surveys"
          onClick={onEdit}
          className="-mr-1 h-10 gap-0 px-1 text-sm font-semibold text-[var(--mk-accent)] hover:text-[var(--mk-accent)]"
        >
          {error ? "Select" : "Edit"}
          <ChevronRight aria-hidden="true" className="size-3.5" />
        </Button>
      </div>
      {error && (
        <p id="job-surveys-error" className="text-[11px] leading-4 text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function jobFormBack(jobId?: number) {
  return jobId
    ? { href: `/creator/jobs/${jobId}`, label: "Back to job details" }
    : { href: "/creator/jobs", label: "Back to my jobs" };
}

export function CreateJobForm({ initialDraft }: { initialDraft?: JobDraft }) {
  const router = useRouter();
  const back = jobFormBack(initialDraft?.id);
  const startingDraft = initialDraft ?? {
    values: { title: "", description: "", budget: "", deadline: "" },
    selectedSurveyIds: [],
    surveys: [],
  };
  const busy = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [reconcile, setReconcile] = useState(false);
  const [navigationError, setNavigationError] = useState<string | null>(null);
  const [selectingSurveys, setSelectingSurveys] = useState(false);
  const [selectedSurveyIds, setSelectedSurveyIds] = useState<string[]>(
    startingDraft.selectedSurveyIds,
  );
  const [surveyOptions, setSurveyOptions] = useState<readonly JobSurveyOption[]>(
    startingDraft.surveys ?? [],
  );
  const [values, setValues] = useState<CreateJobValues>(startingDraft.values);
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const errors: CreateJobFieldErrors = validationAttempted
    ? createJobFieldErrors(values, selectedSurveyIds)
    : {};
  const hasErrors = Object.keys(errors).length > 0;
  const selectedSurveys = selectedSurveyIds.map(
    (id) =>
      surveyOptions.find((survey) => survey.id === id) ?? {
        id,
        title: surveyDisplayId(id),
        targetResponses: null,
      },
  );

  function requiredInputProps(field: "title" | "budget" | "deadline") {
    return {
      name: field,
      required: true,
      value: values[field],
      onChange: (event: ChangeEvent<HTMLInputElement>) => {
        setValues((current) => ({ ...current, [field]: event.target.value }));
      },
      "aria-invalid": Boolean(errors[field]),
      "aria-describedby": errors[field] ? `job-${field}-error` : undefined,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || reconcile) return;
    setValidationAttempted(true);
    setAlertDismissed(false);
    if (Object.keys(createJobFieldErrors(values, selectedSurveyIds)).length > 0) return;

    setNavigationError(null);
    busy.current = true;
    setSubmitting(true);
    let saved = false;
    try {
      const result = initialDraft
        ? await saveJobDetails(String(initialDraft.id), selectedSurveyIds, values)
        : await createPendingJob(selectedSurveyIds, values);
      if (result.status !== "success") {
        setNavigationError(result.message);
        setReconcile(result.status === "reconcile");
        return;
      }
      if ("notice" in result && result.notice) {
        setNavigationError(result.notice);
        return;
      }
      const jobId = "jobId" in result ? result.jobId : result.job.job_id;
      if (!initialDraft) markJobCreated(result.creatorId, jobId);
      else markJobUpdated(result.creatorId, jobId);
      saved = true;
      router.push(`/creator/jobs/${encodeURIComponent(jobId)}`);
    } catch {
      setNavigationError("The save could not be confirmed. Check your job before trying again.");
      setReconcile(!initialDraft);
    } finally {
      if (!saved) {
        busy.current = false;
        setSubmitting(false);
      }
    }
  }

  return (
    <>
      <section
        hidden={selectingSurveys}
        aria-labelledby="create-job-heading"
        className="mx-auto w-full max-w-md"
      >
        <header className="mb-7 flex items-center gap-1">
          <Link
            href={back.href}
            aria-label={back.label}
            className="-ml-2 inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-[var(--mk-text)] outline-none hover:bg-[var(--mk-hover)] focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </Link>
          <div>
            <h1
              id="create-job-heading"
              className="text-lg leading-6 font-bold text-[var(--mk-text)]"
            >
              {initialDraft ? "Edit job" : "Create job"}
            </h1>
            <p className="mt-0.5 text-xs text-[var(--mk-muted)]">
              {hasErrors ? "Complete the required fields" : "Tell marketers what you need"}
            </p>
          </div>
        </header>

        <form
          noValidate
          onSubmit={handleSubmit}
          aria-labelledby="create-job-heading"
          aria-busy={submitting}
          className="space-y-3.5"
        >
          <fieldset disabled={submitting || reconcile} className="space-y-3.5">
            {(hasErrors || navigationError) && !alertDismissed && (
              <JobValidationAlert
                onDismiss={() => setAlertDismissed(true)}
                message={navigationError ?? undefined}
              />
            )}

            <JobFormField id="job-title" label="Job title" required error={errors.title}>
              <Input
                {...requiredInputProps("title")}
                id="job-title"
                placeholder="Enter a clear job title"
                maxLength={200}
                className={fieldClassName}
              />
            </JobFormField>

            <JobFormField id="job-description" label="Description" error={errors.description}>
              <Textarea
                id="job-description"
                name="description"
                maxLength={5000}
                value={values.description}
                onChange={(event) => {
                  setValues((current) => ({ ...current, description: event.target.value }));
                }}
                placeholder="Recruit students, share two research surveys and deliver a short insight summary."
                rows={2}
                className="min-h-[72px] resize-y rounded-xl border-transparent bg-[var(--mk-field)] px-3 py-2.5 text-sm leading-5 text-[var(--mk-text)] shadow-[var(--mk-shadow)] placeholder:text-[var(--mk-muted)] md:text-sm"
              />
            </JobFormField>

            <JobFormField
              id="job-budget"
              label="Budget / compensation"
              required
              error={errors.budget}
            >
              <Input
                {...requiredInputProps("budget")}
                id="job-budget"
                placeholder="e.g. 5000.00"
                inputMode="decimal"
                className={fieldClassName}
              />
            </JobFormField>

            <JobFormField id="job-deadline" label="Deadline" required error={errors.deadline}>
              <div className="relative">
                <Input
                  {...requiredInputProps("deadline")}
                  id="job-deadline"
                  type="date"
                  className={`${fieldClassName} ${styles.deadlineInput} pr-11`}
                />
                <span
                  aria-hidden="true"
                  className={`${styles.deadlinePlaceholder} pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-[var(--mk-muted)]`}
                >
                  Select a deadline
                </span>
                <CalendarDays
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute top-1/2 right-3 size-[18px] -translate-y-1/2 text-[var(--mk-accent)]",
                    errors.deadline && "text-destructive",
                  )}
                />
              </div>
            </JobFormField>

            <JobSurveySummary
              surveys={selectedSurveys}
              error={errors.surveys}
              onEdit={() => setSelectingSurveys(true)}
            />

            {!hasErrors && (
              <p className="text-xs leading-[1.25] text-[var(--mk-text)]">
                Your job will be saved as Pending. Invite marketers next to receive offers.
              </p>
            )}
            <p className="text-xs text-[var(--mk-muted)]">
              All job details and survey links are saved to your account. Delivery must be on or
              before the job deadline and every linked survey deadline.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (window.confirm("Discard your unsaved job changes?"))
                    router.push(
                      initialDraft ? `/creator/jobs/${initialDraft.id}` : "/creator/jobs",
                    );
                }}
                className="h-11 rounded-[14px] bg-[var(--mk-hover)] text-sm font-bold text-[var(--mk-text)] hover:bg-[var(--mk-border)]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={hasErrors || submitting || reconcile}
                className="h-11 rounded-[14px] bg-[var(--mk-action)] text-sm font-bold text-white hover:bg-[var(--mk-action-hover)] disabled:bg-[var(--mk-border)] disabled:text-[var(--mk-muted)] disabled:opacity-100"
              >
                {submitting ? "Saving…" : initialDraft ? "Save changes" : "Create job"}
              </Button>
            </div>
          </fieldset>
          {reconcile && (
            <Link href="/creator/jobs" className="text-sm text-[var(--mk-accent)] underline">
              Check your jobs
            </Link>
          )}
        </form>
      </section>
      {selectingSurveys && (
        <JobSurveySelector
          initialSelectedSurveyIds={selectedSurveyIds}
          onBack={() => setSelectingSurveys(false)}
          onSave={(surveyIds, surveys) => {
            setSelectedSurveyIds(surveyIds);
            setSurveyOptions(surveys);
            setSelectingSurveys(false);
          }}
        />
      )}
    </>
  );
}
