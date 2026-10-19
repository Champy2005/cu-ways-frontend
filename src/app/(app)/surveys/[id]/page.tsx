import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { getSurvey } from "@/features/surveys/api";
import { SurveyReadError } from "@/features/surveys/components/survey-read-error";
import { isSurveyId, safeSurveyUrl } from "@/features/surveys/schemas";
import type { Survey } from "@/features/surveys/types";

export const metadata = { title: "Survey details | CU Ways" };

export default async function SurveyDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || !isSurveyId(Number(id))) notFound();
  let survey: Survey;
  try {
    survey = await getSurvey(Number(id));
  } catch (error) {
    return <SurveyReadError error={error} />;
  }
  const url = safeSurveyUrl(survey.survey_link);
  const { created } = await searchParams;
  return (
    <div className="mx-auto max-w-2xl space-y-6 text-zinc-950">
      <Link href="/surveys" className="text-sm underline">
        Back to My surveys
      </Link>
      {created === "1" ? (
        <p role="status" className="rounded-lg bg-emerald-50 p-4 text-emerald-900">
          Survey created successfully.
        </p>
      ) : null}
      <section className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-500">Survey #{survey.survey_id}</p>
        <h1 className="text-3xl font-semibold break-words">{survey.title}</h1>
        <p className="whitespace-pre-wrap break-words text-zinc-600">
          {survey.description || "No description provided."}
        </p>
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="font-semibold">Survey link</dt>
            <dd className="mt-1 break-all">
              {url ? (
                <a href={url} target="_blank" rel="noopener noreferrer" className="underline">
                  {survey.survey_link} (opens in a new tab)
                </a>
              ) : (
                survey.survey_link
              )}
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Target demographic</dt>
            <dd className="mt-1 break-words">{survey.target_group || "Unspecified"}</dd>
          </div>
          <div>
            <dt className="font-semibold">Desired responses</dt>
            <dd className="mt-1">{survey.desired_responses ?? "Unspecified"}</dd>
          </div>
          <div>
            <dt className="font-semibold">Deadline (UTC)</dt>
            <dd className="mt-1">
              {survey.deadline
                ? new Date(survey.deadline).toISOString().slice(0, 10)
                : "Unspecified"}
            </dd>
          </div>
        </dl>
      </section>
      <Link href="/creator/jobs/create" className={buttonVariants()}>
        Create a job
      </Link>
    </div>
  );
}
