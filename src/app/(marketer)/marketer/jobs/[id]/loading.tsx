import { JobsHeading, JobsSkeleton } from "@/features/marketer-jobs/jobs-ui";
import s from "@/features/marketer-jobs/jobs.module.css";

export default function LoadingJobDetails() {
  return (
    <section className={s.page} aria-busy="true">
      <JobsHeading title="Job details" backHref="/marketer/jobs" />
      <JobsSkeleton detail />
    </section>
  );
}
