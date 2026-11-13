import { notFound } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { getSurvey } from "@/features/surveys/api";
import { CreateSurveyForm } from "@/features/surveys/components/create-survey-form";
import { SurveyReadError } from "@/features/surveys/components/survey-read-error";
import { isSurveyId } from "@/features/surveys/schemas";

export const metadata = { title: "Edit survey | CU Ways" };

export default async function EditSurveyPage({ params }: PageProps<"/surveys/[id]/edit">) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || !isSurveyId(Number(id))) notFound();
  const result = await getSurvey(Number(id)).then(
    (survey) => ({ survey, error: null }),
    (error: unknown) => ({ survey: null, error }),
  );
  if (!result.survey) return <SurveyReadError error={result.error} />;
  return (
    <section className="mx-auto w-full max-w-md space-y-5">
      <BackLink href={`/surveys/${id}`} label="Back to survey" showLabel />
      <h1 className="text-xl font-semibold">Edit survey</h1>
      <CreateSurveyForm survey={result.survey} />
    </section>
  );
}
