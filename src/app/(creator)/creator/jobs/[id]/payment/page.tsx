import { loadJobPaymentData } from "@/features/jobs/api";
import { JobPaymentPage } from "@/features/jobs/components/job-payment-page";
import { JobRecordUnavailable, parseJobRouteId } from "@/features/jobs/components/job-record-route";

export const metadata = { title: "Record payment | CU Ways" };

export default async function JobPaymentRoute({ params }: { params: Promise<{ id: string }> }) {
  const jobId = parseJobRouteId((await params).id);
  let data: Awaited<ReturnType<typeof loadJobPaymentData>>;
  try {
    data = await loadJobPaymentData(jobId);
  } catch (error) {
    return (
      <JobRecordUnavailable
        error={error}
        ownerOnly="Only the job's Creator can record its payment."
      />
    );
  }
  return <JobPaymentPage key={jobId} data={data} />;
}
