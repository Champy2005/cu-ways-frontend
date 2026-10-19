import Link from "next/link";
import { CreateSurveyForm } from "@/features/surveys/components/create-survey-form";

export const metadata = { title: "Create survey | CU Ways" };

export default function CreateSurveyPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <nav className="mb-2 text-sm text-zinc-500">
            <Link href="/surveys" className="hover:underline">
              Surveys
            </Link>{" "}
            / <span className="text-zinc-800 font-medium">New</span>
          </nav>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Create Survey</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Save your survey details and external form link. Questions and responses stay with your
            survey provider.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <CreateSurveyForm />
      </div>
    </div>
  );
}
