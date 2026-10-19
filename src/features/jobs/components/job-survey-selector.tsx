"use client";

import { Check, ChevronLeft, CircleHelp, FileSearch, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { loadJobSurveys, type JobSurveysActionState } from "@/features/jobs/actions";
import { surveyDisplayId } from "@/features/jobs/survey-options";
import type { JobSurveyOption } from "@/features/jobs/types";
import { cn } from "@/lib/utils";

type JobSurveySelectorProps = {
  initialSelectedSurveyIds: readonly string[];
  linkedSurveyIds?: readonly string[];
  backLabel?: string;
  pending?: boolean;
  onBack: () => void;
  onSave: (surveyIds: string[], surveys: readonly JobSurveyOption[]) => void;
};

function SurveySelectorHeader({
  onBack,
  backLabel,
  pending = false,
}: {
  onBack: () => void;
  backLabel: string;
  pending?: boolean;
}) {
  return (
    <header className="mb-7 flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        aria-label={backLabel}
        onClick={onBack}
        disabled={pending}
        className="-ml-2 size-10 shrink-0 rounded-lg text-[var(--mk-text)]"
      >
        <ChevronLeft aria-hidden="true" className="size-5" />
      </Button>
      <div>
        <h1
          id="select-surveys-heading"
          className="text-lg leading-6 font-bold text-[var(--mk-text)]"
        >
          Select surveys
        </h1>
        <p className="mt-0.5 text-xs text-[var(--mk-muted)]">Choose one or more for this job</p>
      </div>
    </header>
  );
}

export function JobSurveySelector(props: JobSurveySelectorProps) {
  const [result, setResult] = useState<JobSurveysActionState | { status: "loading" }>({
    status: "loading",
  });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    loadJobSurveys()
      .then((response) => {
        if (active) setResult(response);
      })
      .catch(() => {
        if (active)
          setResult({
            status: "error",
            message: "Your surveys could not be loaded. Please try again.",
          });
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  if (result.status === "success" && result.surveys.length > 0) {
    return <SurveySelectorContent {...props} surveys={result.surveys} />;
  }
  function retry() {
    setResult({ status: "loading" });
    setAttempt((current) => current + 1);
  }
  return (
    <section
      aria-labelledby="select-surveys-heading"
      className="mx-auto w-full max-w-md text-[var(--mk-text)]"
    >
      <SurveySelectorHeader
        onBack={props.onBack}
        backLabel={props.backLabel ?? "Back to create job"}
        pending={props.pending}
      />
      {result.status === "loading" ? (
        <p role="status" className="text-sm text-[var(--mk-muted)]">
          Loading your surveys…
        </p>
      ) : (
        <div className="rounded-2xl border border-[var(--mk-border)] bg-[var(--mk-surface)] p-4 shadow-card">
          {result.status === "error" ? (
            <div role="alert">
              <h2 className="text-base font-bold">Your surveys could not be loaded</h2>
              <p className="mt-2 text-sm text-[var(--mk-muted)]">{result.message}</p>
            </div>
          ) : (
            <div role="status">
              <h2 className="text-base font-bold">No surveys yet</h2>
              <p className="mt-2 text-sm text-[var(--mk-muted)]">
                Create a survey first, then return here to select it.
              </p>
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={retry}
            className="mt-4 border-[var(--mk-border)] text-[var(--mk-text)]"
          >
            {result.status === "error" ? "Try again" : "Refresh surveys"}
          </Button>
        </div>
      )}
    </section>
  );
}

function SurveySelectorContent({
  surveys,
  initialSelectedSurveyIds,
  linkedSurveyIds = [],
  backLabel = "Back to create job",
  onBack,
  onSave,
  pending = false,
}: JobSurveySelectorProps & { surveys: readonly JobSurveyOption[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(() =>
    initialSelectedSurveyIds.filter(
      (id) => !linkedSurveyIds.includes(id) && surveys.some((survey) => survey.id === id),
    ),
  );
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matchingSurveys = surveys.filter((survey) =>
    survey.title.toLowerCase().includes(normalizedQuery),
  );
  const selectedCount = selectedIds.length;
  const availableCount = matchingSurveys.filter(
    (survey) => !linkedSurveyIds.includes(survey.id),
  ).length;

  function toggleSurvey(surveyId: string, checked: boolean) {
    if (pending || linkedSurveyIds.includes(surveyId)) return;
    setSelectedIds((current) =>
      checked ? [...current, surveyId] : current.filter((id) => id !== surveyId),
    );
  }

  return (
    <section aria-labelledby="select-surveys-heading" className="mx-auto w-full max-w-md">
      <SurveySelectorHeader onBack={onBack} backLabel={backLabel} pending={pending} />

      <div className="mb-3 space-y-1.5">
        <label
          htmlFor="job-survey-search"
          className="block text-xs font-medium text-[var(--mk-muted)]"
        >
          Search surveys
        </label>
        <div className="relative">
          <Input
            id="job-survey-search"
            name="survey-search"
            type="search"
            disabled={pending}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by survey name"
            className="h-[42px] rounded-xl border-[var(--mk-border)] bg-[var(--mk-surface)] pr-11 pl-3 text-sm text-[var(--mk-text)] shadow-card placeholder:text-[var(--mk-muted)] md:text-sm"
          />
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-3 size-[18px] -translate-y-1/2 text-[var(--mk-muted)]"
          />
        </div>
      </div>

      <fieldset>
        <legend className="sr-only">Your surveys</legend>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base leading-5 font-bold text-[var(--mk-text)]">Your surveys</h2>
            <p aria-live="polite" className="mt-0.5 text-xs text-[var(--mk-muted)]">
              {availableCount} available
            </p>
          </div>
          <p aria-live="polite" className="text-xs font-semibold text-[var(--mk-info)]">
            {selectedCount} selected
          </p>
        </div>

        <ul className="space-y-2.5">
          {matchingSurveys.map((survey) => {
            const isLinked = linkedSurveyIds.includes(survey.id);
            return (
              <li key={survey.id}>
                <label
                  className={cn(
                    "flex min-h-14 items-center gap-3 rounded-[14px] border border-[var(--mk-border)] bg-[var(--mk-surface)] px-3 py-2.5 transition-colors",
                    isLinked
                      ? "cursor-not-allowed"
                      : "cursor-pointer shadow-card has-[[data-checked]]:border-[var(--mk-accent)]",
                  )}
                >
                  <Checkbox
                    name="surveys"
                    value={survey.id}
                    disabled={isLinked || pending}
                    checked={!isLinked && selectedIds.includes(survey.id)}
                    onCheckedChange={(checked) => toggleSurvey(survey.id, checked)}
                    aria-labelledby={`survey-title-${survey.id}`}
                    aria-describedby={`survey-details-${survey.id}`}
                    className={cn(
                      "size-5 rounded-[5px] border-[var(--mk-muted)]",
                      isLinked
                        ? "bg-[var(--mk-field)] disabled:opacity-100"
                        : "data-checked:border-[var(--mk-action)] data-checked:bg-[var(--mk-action)] data-checked:text-white",
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      id={`survey-title-${survey.id}`}
                      className={cn(
                        "block text-sm leading-5 font-bold",
                        isLinked ? "text-[var(--mk-muted)]" : "text-[var(--mk-text)]",
                      )}
                    >
                      {survey.title}
                    </span>
                    <span
                      id={`survey-details-${survey.id}`}
                      className="block text-xs leading-4 text-[var(--mk-muted)]"
                    >
                      {surveyDisplayId(survey.id)} ·{" "}
                      {isLinked
                        ? "Already linked"
                        : survey.targetResponses === null
                          ? "Target not specified"
                          : `Target: ${survey.targetResponses} responses`}
                    </span>
                  </span>
                  {isLinked && (
                    <span className="shrink-0 rounded-full border border-[var(--mk-border)] bg-[var(--mk-field)] px-2 py-0.5 text-[11px] leading-4 font-semibold text-[var(--mk-muted)]">
                      Linked
                    </span>
                  )}
                </label>
              </li>
            );
          })}
        </ul>
        {matchingSurveys.length === 0 && (
          <Card
            role="status"
            className="items-center gap-0 rounded-2xl border border-[var(--mk-border)] bg-[var(--mk-surface)] px-4 py-6 text-center text-[var(--mk-text)] shadow-card ring-0"
          >
            <div className="mb-2.5 flex size-12 items-center justify-center rounded-full border border-[var(--mk-border)] text-[var(--mk-muted)]">
              <FileSearch aria-hidden="true" className="size-6" />
            </div>
            <h3 className="text-base leading-6 font-bold">No matching surveys</h3>
            <p className="mt-2 text-xs leading-[18px] text-[var(--mk-muted)]">
              We couldn&apos;t find any surveys matching your search.
              <br />
              Try checking for typos or clear your search.
            </p>
          </Card>
        )}
      </fieldset>

      <div className="mt-6 flex items-center gap-2.5 px-3 text-[var(--mk-info)]">
        <CircleHelp aria-hidden="true" className="size-[18px] shrink-0" />
        <div>
          <p className="text-xs font-semibold">At least one survey is required</p>
          <p className="mt-0.5 text-[11px]">Selected surveys will be shown in the job posting.</p>
        </div>
      </div>

      <Button
        type="button"
        onClick={() => {
          if (!pending) onSave([...new Set([...linkedSurveyIds, ...selectedIds])], surveys);
        }}
        disabled={pending || selectedCount === 0}
        className="mt-6 h-11 w-full gap-2 rounded-[14px] bg-[var(--mk-action)] text-sm font-bold text-white shadow-card hover:bg-[var(--mk-action-hover)]"
      >
        <Check aria-hidden="true" className="size-4" />
        Use {selectedCount} {selectedCount === 1 ? "survey" : "surveys"}
      </Button>
    </section>
  );
}
