import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import type { CreatorJobSummary } from "@/features/jobs/types";
import { ReloadJobsButton } from "@/features/jobs/components/reload-jobs-button";
import "../offers.css";

export type CreatorOffersJobPickerProps = {
  state: { status: "success"; items: CreatorJobSummary[] } | { status: "error"; message: string };
};

export function CreatorOffersJobPicker({ state }: CreatorOffersJobPickerProps) {
  return (
    <section className="jo-page">
      <header className="jo-heading">
        <Link href="/creator/dashboard" className="jo-back" aria-label="Back to Creator workspace">
          <ArrowLeft aria-hidden="true" />
        </Link>
        <div>
          <h1>Job offers</h1>
          <p className="jo-muted">Choose a job to compare proposals and hire a marketer.</p>
        </div>
      </header>
      <h2 className="mb-3 mt-6 font-semibold">Your jobs</h2>
      {state.status === "error" ? (
        <div className="jo-empty" role="alert">
          <h3>Your jobs could not be loaded</h3>
          <p>{state.message}</p>
          <ReloadJobsButton />
          <Link href="/creator/dashboard" className="jo-invite">
            Return to Creator workspace
          </Link>
        </div>
      ) : state.items.length === 0 ? (
        <div className="jo-empty">
          <h3>No jobs available</h3>
          <p>Create a job with at least one survey before comparing offers.</p>
          <Link href="/creator/jobs/create" className="jo-invite">
            Create a job
          </Link>
          <Link href="/creator/dashboard" className="jo-invite">
            Return to Creator workspace
          </Link>
        </div>
      ) : (
        <ul className="jo-job-list">
          {state.items.map((job) => (
            <li key={job.job_id}>
              <Link
                href={`/creator/jobs/${job.job_id}/offers`}
                className="jo-job-row"
                aria-label={`Compare offers for job ${job.job_id}, ${job.job_status}`}
              >
                <div className="min-w-0 flex-1">
                  <h3>
                    {job.title ||
                      job.surveys.map((survey) => survey.title).join(", ") ||
                      "No linked surveys"}
                  </h3>
                  <p className="jo-muted">Job #{job.job_id}</p>
                </div>
                <span className="jo-status" data-status={job.job_status}>
                  {job.job_status}
                </span>
                <ChevronRight aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
