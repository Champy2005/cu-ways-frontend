import Link from "next/link";
import { CreateSurveyForm } from "@/features/surveys/components/create-survey-form";

export const metadata = { title: "Create survey | CU Ways" };

export default function CreateSurveyPage() {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <nav className="mb-2 text-sm text-[var(--mk-muted)]">
            <Link href="/surveys" className="hover:underline">
              Surveys
            </Link>{" "}
            / <span className="text-[var(--mk-text)] font-medium">New</span>
          </nav>
          <h1 className="text-lg font-bold tracking-tight text-[var(--mk-text)]">Create Survey</h1>
          <p className="mt-1 text-sm text-[var(--mk-muted)]">
            Save your survey details and external form link. Questions and responses stay with your
            survey provider.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--mk-border)] bg-[var(--mk-surface)] p-6 shadow-sm sm:p-8">
        <CreateSurveyForm />
      </div>
    </div>
  );
}
