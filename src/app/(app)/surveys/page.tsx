import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getSurveys } from "@/features/surveys/api";
import { SurveyReadError } from "@/features/surveys/components/survey-read-error";
import type { Survey } from "@/features/surveys/types";

export const metadata = { title: "My surveys | CU Ways" };

export default async function SurveysPage() {
  let surveys: Survey[] | null = null;
  let readError: unknown;
  try {
    surveys = await getSurveys();
  } catch (error) {
    readError = error;
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-[var(--mk-text)]">My surveys</h1>
          <p className="mt-2 text-sm text-[var(--mk-muted)]">
            Manage your survey records and use them when creating a job.
          </p>
        </div>
        <Link href="/surveys/new" className={buttonVariants({ size: "lg" })}>
          Create Survey
        </Link>
      </div>
      {surveys === null ? (
        <SurveyReadError error={readError} />
      ) : surveys.length === 0 ? (
        <div className="rounded-2xl border border-[var(--mk-border)] bg-[var(--mk-surface)] p-8 text-center shadow-sm">
          <h2 className="text-lg font-medium text-zinc-900">No surveys yet</h2>
          <p className="mt-2 text-sm text-[var(--mk-muted)]">
            Create your first survey with a title and an external survey link.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Your surveys">
          {surveys.map((survey) => (
            <li
              key={survey.survey_id}
              className="min-w-0 rounded-2xl border border-[var(--mk-border)] bg-[var(--mk-surface)] p-6 shadow-sm"
            >
              <p className="text-xs text-[var(--mk-muted)]">Survey #{survey.survey_id}</p>
              <h2 className="mt-2 text-lg font-semibold break-words text-[var(--mk-text)]">
                <Link
                  href={`/surveys/${survey.survey_id}`}
                  className="underline-offset-4 hover:underline"
                >
                  {survey.title}
                </Link>
              </h2>
              <p className="mt-2 text-sm break-words text-[var(--mk-muted)]">
                {survey.target_group || "Target demographic unspecified"}
              </p>
              <p className="mt-2 text-sm text-[var(--mk-muted)]">
                Desired responses: {survey.desired_responses ?? "Unspecified"}
              </p>
            </li>
          ))}
        </ul>
      )}
      <Link href="/creator/jobs/create" className={buttonVariants({ variant: "outline" })}>
        Create a job with your surveys
      </Link>
    </div>
  );
}
