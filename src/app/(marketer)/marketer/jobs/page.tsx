import { loadHiredJobs } from "@/features/marketer-jobs/actions";
import { JobsList } from "@/features/marketer-jobs/jobs-list";
import { parseJobFilter } from "@/features/marketer-jobs/types";

export const metadata = { title: "My Jobs | CU Ways" };

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const query = await searchParams;
  const filter = parseJobFilter(query.status);
  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1);
  return <JobsList initial={await loadHiredJobs()} filter={filter} page={page} />;
}
