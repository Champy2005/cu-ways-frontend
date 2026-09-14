"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDisplayError } from "@/lib/api/errors";
import { createSurvey } from "@/features/surveys/browser-api";
import { createSurveyValidationMessage } from "@/features/surveys/schemas";
import type { CreateSurveyRequest } from "@/features/surveys/types";

export function CreateSurveyForm() {
  const router = useRouter();
  const [values, setValues] = useState<CreateSurveyRequest>({
    title: "",
    survey_link: "",
    description: "",
    target_group: "",
    desired_responses: undefined,
    deadline: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function update<K extends keyof CreateSurveyRequest>(field: K, value: CreateSurveyRequest[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Client-side validation: reject when title or survey_link is empty
    const validationError = createSurveyValidationMessage(values);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsPending(true);
    setError(null);
    try {
      await createSurvey(values);
      router.push("/surveys");
      router.refresh();
    } catch (requestError) {
      setError(getDisplayError(requestError));
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title (Required) */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="survey-title">
          Title <span className="text-red-500">*</span>
        </label>
        <Input
          id="survey-title"
          type="text"
          value={values.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="e.g. Campus Dining Experience Survey"
          required
        />
        <p className="mt-1 text-xs text-muted-foreground">Short, clear name for your survey.</p>
      </div>

      {/* Google Form Link / Survey Link (Required) */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="survey-link">
          Google Form Link / Survey URL <span className="text-red-500">*</span>
        </label>
        <Input
          id="survey-link"
          type="url"
          value={values.survey_link}
          onChange={(e) => update("survey_link", e.target.value)}
          placeholder="https://forms.google.com/..."
          required
        />
        <p className="mt-1 text-xs text-muted-foreground">Full link to your survey form.</p>
      </div>

      {/* Description (Optional) */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="survey-description">
          Description <span className="text-xs text-muted-foreground">(Optional)</span>
        </label>
        <textarea
          id="survey-description"
          rows={3}
          value={values.description ?? ""}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Provide background context or instructions for respondents..."
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {/* Target Demographic (Optional) */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="survey-target-group">
          Target Demographic <span className="text-xs text-muted-foreground">(Optional)</span>
        </label>
        <Input
          id="survey-target-group"
          type="text"
          value={values.target_group ?? ""}
          onChange={(e) => update("target_group", e.target.value)}
          placeholder="e.g. Undergraduate Engineering Students, Age 18-25"
        />
      </div>

      {/* Desired Responses & Deadline Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="survey-desired-responses">
            Desired Responses <span className="text-xs text-muted-foreground">(Optional)</span>
          </label>
          <Input
            id="survey-desired-responses"
            type="number"
            min={1}
            value={values.desired_responses ?? ""}
            onChange={(e) =>
              update("desired_responses", e.target.value ? Number(e.target.value) : undefined)
            }
            placeholder="e.g. 100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="survey-deadline">
            Deadline <span className="text-xs text-muted-foreground">(Optional)</span>
          </label>
          <Input
            id="survey-deadline"
            type="date"
            value={values.deadline ? values.deadline.slice(0, 10) : ""}
            onChange={(e) => update("deadline", e.target.value ? e.target.value : "")}
          />
        </div>
      </div>

      {/* Error display */}
      {error ? (
        <div className="rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-600 dark:text-red-400" role="alert">
          {error}
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link href="/surveys" className={buttonVariants({ variant: "outline" })}>
          Cancel
        </Link>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating Survey..." : "Create Survey"}
        </Button>
      </div>
    </form>
  );
}
