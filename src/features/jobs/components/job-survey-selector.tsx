"use client";

import { Check, ChevronLeft, CircleHelp, Search } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { JobSurveyOption } from "@/features/jobs/types";

type JobSurveySelectorProps = {
  surveys: readonly JobSurveyOption[];
  initialSelectedSurveyIds: readonly string[];
  onBack: () => void;
  onSave: (surveyIds: string[]) => void;
};

export function JobSurveySelector({
  surveys,
  initialSelectedSurveyIds,
  onBack,
  onSave,
}: JobSurveySelectorProps) {
  const [selectedIds, setSelectedIds] = useState(() => [...initialSelectedSurveyIds]);
  const selectedCount = selectedIds.length;

  function toggleSurvey(surveyId: string, checked: boolean) {
    setSelectedIds((current) =>
      checked ? [...current, surveyId] : current.filter((id) => id !== surveyId),
    );
  }

  return (
    <section aria-labelledby="select-surveys-heading" className="mx-auto w-full max-w-md">
      <header className="mb-7 flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          aria-label="Back to create job"
          onClick={onBack}
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
            placeholder="Search by title or ID"
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
            <p className="mt-0.5 text-xs text-[var(--mk-muted)]">{surveys.length} available</p>
          </div>
          <p aria-live="polite" className="text-xs font-semibold text-[var(--mk-info)]">
            {selectedCount} selected
          </p>
        </div>

        <ul className="space-y-2.5">
          {surveys.map((survey) => (
            <li key={survey.id}>
              <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-[14px] border border-[var(--mk-border)] bg-[var(--mk-surface)] px-3 py-2.5 shadow-card transition-colors has-[[data-checked]]:border-[var(--mk-accent)]">
                <Checkbox
                  name="surveys"
                  value={survey.id}
                  checked={selectedIds.includes(survey.id)}
                  onCheckedChange={(checked) => toggleSurvey(survey.id, checked)}
                  aria-labelledby={`survey-title-${survey.id}`}
                  aria-describedby={`survey-details-${survey.id}`}
                  className="size-5 rounded-[5px] border-[var(--mk-muted)] data-checked:border-[var(--mk-action)] data-checked:bg-[var(--mk-action)] data-checked:text-white"
                />
                <span className="min-w-0">
                  <span
                    id={`survey-title-${survey.id}`}
                    className="block text-sm leading-5 font-bold text-[var(--mk-text)]"
                  >
                    {survey.title}
                  </span>
                  <span
                    id={`survey-details-${survey.id}`}
                    className="block text-xs leading-4 text-[var(--mk-muted)]"
                  >
                    {survey.id} · Target: {survey.targetResponses} responses
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
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
        onClick={() => onSave(selectedIds)}
        disabled={selectedCount === 0}
        className="mt-6 h-11 w-full gap-2 rounded-[14px] bg-[var(--mk-action)] text-sm font-bold text-white shadow-card hover:bg-[var(--mk-action-hover)]"
      >
        <Check aria-hidden="true" className="size-4" />
        Use {selectedCount} {selectedCount === 1 ? "survey" : "surveys"}
      </Button>
    </section>
  );
}
