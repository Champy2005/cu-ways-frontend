import { JobsHeading, JobsSkeleton } from "@/features/marketer-jobs/jobs-ui";
import s from "@/features/marketer-jobs/jobs.module.css";

export default function LoadingJobs() {
  return (
    <section className={s.page} aria-busy="true">
      <JobsHeading title="My Jobs" />
      <JobsSkeleton />
    </section>
  );
}
