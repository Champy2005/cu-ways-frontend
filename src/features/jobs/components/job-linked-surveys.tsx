"use client";

import { ClipboardList, Plus } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { RemoveJobSurveyDialog } from "@/features/jobs/components/remove-job-survey-dialog";
import { surveyDisplayId } from "@/features/jobs/survey-options";

export type LinkedJobSurvey = {
  id: string;
  title: string;
  linkedOn?: string;
};

export function JobLinkedSurveys({
  surveys,
  onAdd,
  onRemove,
  pending = false,
}: {
  surveys: readonly LinkedJobSurvey[];
  onAdd: () => void;
  onRemove: (surveyId: string) => void;
  pending?: boolean;
}) {
  const [surveyToRemove, setSurveyToRemove] = useState<LinkedJobSurvey | null>(null);
  const removeButton = useRef<HTMLButtonElement>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const isLastSurvey = surveys.length <= 1;

  return (
    <section
      aria-labelledby="linked-surveys-heading"
      className="border-t border-[var(--mk-border)] pt-5 text-[var(--mk-text)]"
    >
      <h2 id="linked-surveys-heading" className="text-xl leading-6 font-bold">
        Manage Linked Surveys
      </h2>
      <p id="linked-surveys-requirement" className="mt-0.5 text-sm text-[var(--mk-muted)]">
        At least one survey is required
      </p>

      <ul className="mt-4 space-y-3">
        {surveys.map((survey) => (
          <li
            key={survey.id}
            className="flex min-h-[68px] items-center gap-3 rounded-2xl border border-[var(--mk-border)] bg-[var(--mk-surface)] px-3 py-2.5 shadow-[var(--mk-shadow)]"
          >
            <ClipboardList aria-hidden="true" className="size-5 shrink-0 text-[var(--mk-accent)]" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm leading-5 font-bold wrap-break-word sm:text-base">
                {survey.title}
              </h3>
              <p className="mt-0.5 text-xs leading-4 text-[var(--mk-muted)]">
                {surveyDisplayId(survey.id)} · {isLastSurvey ? "Only linked survey" : "Linked"}
                {!isLastSurvey && survey.linkedOn && (
                  <>
                    {" "}
                    <time dateTime={survey.linkedOn}>
                      {new Intl.DateTimeFormat("en-GB", {
                        day: "numeric",
                        month: "short",
                        timeZone: "UTC",
                      }).format(new Date(`${survey.linkedOn}T00:00:00Z`))}
                    </time>
                  </>
                )}
              </p>
            </div>
            <Button
              type="button"
              disabled={pending}
              variant="ghost"
              aria-label={`Remove ${survey.title}`}
              aria-describedby={isLastSurvey ? "linked-surveys-requirement" : undefined}
              onClick={(event) => {
                removeButton.current = event.currentTarget;
                setSurveyToRemove(survey);
              }}
              className="h-9 shrink-0 px-1 text-sm font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>

      <Button
        ref={addButton}
        type="button"
        disabled={pending}
        variant="ghost"
        onClick={onAdd}
        className="mt-5 h-12 w-full gap-2 rounded-2xl border border-[var(--mk-border)] bg-[var(--mk-surface)] text-base font-bold text-[var(--mk-accent)] shadow-[var(--mk-shadow)] hover:bg-[var(--mk-hover)]"
      >
        <Plus aria-hidden="true" className="size-5" />
        Add existing surveys
      </Button>
      {surveyToRemove && (
        <RemoveJobSurveyDialog
          surveyTitle={surveyToRemove.title}
          isLastSurvey={isLastSurvey}
          onClose={() => setSurveyToRemove(null)}
          onAddAnother={() => {
            setSurveyToRemove(null);
            onAdd();
          }}
          onConfirm={() => {
            removeButton.current = null;
            if (!pending && surveys.length > 1) onRemove(surveyToRemove.id);
            setSurveyToRemove(null);
          }}
          finalFocus={() =>
            removeButton.current?.isConnected ? removeButton.current : addButton.current
          }
        />
      )}
    </section>
  );
}
