import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function SurveysPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">Workspace</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">Surveys</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Create survey records or explore active research surveys.
          </p>
        </div>
        <div>
          <Link href="/surveys/new" className={buttonVariants({ size: "lg" })}>
            + Create Survey
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-medium text-zinc-900">No surveys listed yet</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Get started by creating your first survey record for marketers.
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/surveys/new" className={buttonVariants({ variant: "default" })}>
            Create Survey Now
          </Link>
        </div>
      </div>
    </div>
  );
}
