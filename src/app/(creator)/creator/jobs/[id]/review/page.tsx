import { loadJobReviewData } from "@/features/jobs/api";
import { JobRecordUnavailable, parseJobRouteId } from "@/features/jobs/components/job-record-route";
import { JobReviewPage } from "@/features/jobs/components/job-review-page";

export const metadata = { title: "Write a review | CU Ways" };

export default async function JobReviewRoute({ params }: { params: Promise<{ id: string }> }) {
  const jobId = parseJobRouteId((await params).id);
  let data: Awaited<ReturnType<typeof loadJobReviewData>>;
  try {
    data = await loadJobReviewData(jobId);
  } catch (error) {
    return <JobRecordUnavailable error={error} ownerOnly="Only the job's Creator can review it." />;
  }
  return <JobReviewPage key={jobId} data={data} />;
}
