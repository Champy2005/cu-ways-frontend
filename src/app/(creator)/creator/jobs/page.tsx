import Link from "next/link";
import { loadCreatorJobs } from "@/features/jobs/api";
import { ReloadJobsButton } from "@/features/jobs/components/reload-jobs-button";

export const metadata = { title: "My jobs | CU Ways" };

export default async function MyJobsPage() {
  const state = await loadCreatorJobs();
  return (
    <section className="mx-auto max-w-4xl text-[var(--mk-text)]">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="mk-page-title">My jobs</h1>
          <p className="mt-1 text-sm text-[var(--mk-muted)]">
            Manage your jobs, invitations, and offers.
          </p>
        </div>
        <Link
          href="/creator/jobs/create"
          className="mk-primary-button inline-flex min-h-11 items-center px-4 text-sm font-semibold"
        >
          Create a job
        </Link>
      </header>
      {state.status === "error" ? (
        <div role="alert" className="mk-card p-5">
          <p>{state.message}</p>
          <ReloadJobsButton />
        </div>
      ) : state.items.length === 0 ? (
        <div className="mk-card p-8 text-center">
          <h2 className="font-bold">No jobs yet</h2>
          <p className="mt-2 text-sm text-[var(--mk-muted)]">
            Create a job with your surveys, then invite marketers.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {state.items.map((job) => (
            <li key={job.job_id} className="mk-card p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="min-w-0 font-bold break-words">
                  <Link
                    href={`/creator/jobs/${job.job_id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {job.title || `Job #${job.job_id}`}
                  </Link>
                </h2>
                <span className="rounded-lg border border-[var(--mk-border)] px-2 py-1 text-xs">
                  {job.job_status}
                </span>
              </div>
              <p className="mt-2 text-xs text-[var(--mk-muted)]">
                Job #{job.job_id} · {job.surveys.map((survey) => survey.title).join(", ")}
              </p>
              <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold text-[var(--mk-accent)]">
                <Link href={`/creator/jobs/${job.job_id}`}>Job details</Link>
                <Link href={`/creator/jobs/${job.job_id}/offers`}>View offers</Link>
                {job.job_status === "Pending" && (
                  <Link href={`/creator/jobs/${job.job_id}/invite`}>Invite marketers</Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
