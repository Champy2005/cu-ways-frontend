import { loadHiredJob } from "@/features/marketer-jobs/actions";
import { JobDetail } from "@/features/marketer-jobs/job-detail";
import { jobsHref, parseJobFilter } from "@/features/marketer-jobs/types";

export const metadata = { title: "Job details | CU Ways" };

export default async function JobPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { id } = await params;
  const { returnTo } = await searchParams;
  let backHref = jobsHref();
  if (returnTo?.startsWith("/marketer/jobs?")) {
    const query = new URLSearchParams(returnTo.slice(returnTo.indexOf("?") + 1));
    const page = Math.max(1, Number.parseInt(query.get("page") ?? "1", 10) || 1);
    backHref = jobsHref(parseJobFilter(query.get("status")), page);
  }
  return <JobDetail key={id} id={id} initial={await loadHiredJob(id)} backHref={backHref} />;
}
