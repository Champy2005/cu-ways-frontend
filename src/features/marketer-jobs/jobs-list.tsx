"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { StatusText } from "@/components/ui/status-text";
import { loadHiredJobs } from "./actions";
import { useJobsWorkspace } from "./jobs-workspace";
import {
  JobsEmpty,
  JobsFailure,
  JobsHeading,
  JobsNotice,
  JobsSkeleton,
  ListOperationNotice,
  RefreshJobs,
} from "./jobs-ui";
import {
  filterJobs,
  applyStartedJob,
  formatJobDate,
  formatJobPrice,
  jobFilters,
  jobsHref,
  type HiredJob,
  type JobFilter,
  type JobsResult,
} from "./types";
import s from "./jobs.module.css";

function JobCard({ job, returnHref }: { job: HiredJob; returnHref: string }) {
  return (
    <article className={s.jobCard}>
      <div className={s.cardHeading}>
        <span className={s.identity}>Job #{job.id}</span>
        <StatusText status={job.status} />
      </div>
      <div className={s.cardCopy}>
        <h2>
          <span className="sr-only">Job #{job.id} · </span>
          {job.surveys.map((survey) => survey.title).join(" · ") || "Survey details unavailable"}
        </h2>
        <dl className={s.jobFacts}>
          <div>
            <dt>Creator</dt>
            <dd>{job.creator}</dd>
          </div>
          <div>
            <dt>Agreed price</dt>
            <dd>{formatJobPrice(job.price)}</dd>
          </div>
          <div>
            <dt>Deadline</dt>
            <dd>{formatJobDate(job.deadline)}</dd>
          </div>
        </dl>
      </div>
      <Link
        className={s.entry}
        href={`/marketer/jobs/${job.id}?${new URLSearchParams({ returnTo: returnHref })}`}
        aria-label={`View job #${job.id}`}
      >
        View job
      </Link>
    </article>
  );
}

function JobsPagination({
  page,
  pages,
  filter,
}: {
  page: number;
  pages: number;
  filter: JobFilter;
}) {
  return (
    <nav className={s.pagination} aria-label="Jobs pagination">
      {page > 1 ? (
        <Link href={jobsHref(filter, page - 1)} aria-label="Previous page">
          <ChevronLeft size={20} />
        </Link>
      ) : (
        <button disabled aria-label="Previous page">
          <ChevronLeft size={20} />
        </button>
      )}
      <span>
        {page} / {pages}
      </span>
      {page < pages ? (
        <Link href={jobsHref(filter, page + 1)} aria-label="Next page">
          <ChevronRight size={20} />
        </Link>
      ) : (
        <button disabled aria-label="Next page">
          <ChevronRight size={20} />
        </button>
      )}
    </nav>
  );
}

function useJobsListData(initial: JobsResult<HiredJob[]>) {
  const [result, setResult] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [stale, setStale] = useState(false);
  const { operation } = useJobsWorkspace();
  const latestRead = useRef(0);
  // A back/forward navigation supplies fresh route data without losing the active operation.
  useEffect(() => {
    latestRead.current += 1;
  }, [initial]);
  const [previousInitial, setPreviousInitial] = useState(initial);
  if (previousInitial !== initial) {
    setPreviousInitial(initial);
    setResult(initial);
    setStale(false);
  }
  const effectiveResult: JobsResult<HiredJob[]> =
    operation?.result?.status === "expired" ? { status: "expired" } : result;
  const jobs = effectiveResult.status === "success" ? effectiveResult.data : [];
  const updatedJobs = jobs.map((job) => {
    const outcome = operation?.result;
    return operation?.jobId === job.id ? applyStartedJob(job, outcome) : job;
  });
  function refresh() {
    const request = ++latestRead.current;
    startTransition(async () => {
      const next = await loadHiredJobs().catch(() => ({ status: "error" as const }));
      if (request !== latestRead.current) return;
      if (next.status === "error" && result.status === "success") setStale(true);
      else {
        setResult(next);
        setStale(false);
      }
    });
  }

  return { result: effectiveResult, pending, stale, jobs: updatedJobs, refresh };
}

export function JobsList({
  initial,
  filter,
  page,
}: {
  initial: JobsResult<HiredJob[]>;
  filter: JobFilter;
  page: number;
}) {
  const router = useRouter();
  const { result, pending, stale, jobs, refresh } = useJobsListData(initial);
  const matching = filterJobs(jobs, filter);
  const pages = Math.max(1, Math.ceil(matching.length / 20));
  const currentPage = Math.min(page, pages);
  const href = jobsHref(filter, currentPage);

  return (
    <section className={s.page} aria-labelledby="jobs-heading" aria-busy={pending}>
      <JobsHeading title="My Jobs">
        <label className={s.filter}>
          Status
          <div className={s.selectWrap}>
            <select
              aria-label="Filter jobs by status"
              value={filter}
              onChange={(event) => router.push(jobsHref(event.target.value as JobFilter))}
            >
              {jobFilters.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown size={18} aria-hidden="true" />
          </div>
        </label>
      </JobsHeading>
      <ListOperationNotice />
      {stale && (
        <JobsNotice
          title="Latest results couldn’t load"
          tone="warning"
          action={<RefreshJobs onClick={refresh} disabled={pending} label="Try again" />}
        >
          Previously loaded results.
        </JobsNotice>
      )}
      {pending && result.status !== "success" ? (
        <JobsSkeleton />
      ) : result.status !== "success" ? (
        <JobsFailure status={result.status} returnTo={href} onRetry={refresh} list />
      ) : matching.length === 0 ? (
        <JobsEmpty
          allEmpty={jobs.length === 0}
          filtered={filter !== "active" && filter !== "all"}
          onChange={() => router.push(jobsHref(filter === "active" ? "all" : "active"))}
        />
      ) : (
        <>
          <p className="sr-only" role="status">
            {matching.length} jobs. Page {currentPage} of {pages}.
          </p>
          <div
            className={s.jobRows}
            aria-label={stale ? "Previously loaded results" : "Hired jobs"}
          >
            {matching.slice((currentPage - 1) * 20, currentPage * 20).map((job) => (
              <JobCard key={job.id} job={job} returnHref={href} />
            ))}
          </div>
          <JobsPagination page={currentPage} pages={pages} filter={filter} />
        </>
      )}
    </section>
  );
}
