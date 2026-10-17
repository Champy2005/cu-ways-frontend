import { JobDraftPage } from "@/features/jobs/components/job-draft-page";

export const metadata = { title: "Job details | CU Ways" };

export default async function CreatorJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ preview?: string | string[] }>;
}) {
  const [{ id }, { preview }] = await Promise.all([params, searchParams]);
  // UI-only preview until the saved offer status is connected.
  return <JobDraftPage jobId={id} previewAccepted={preview === "accepted"} />;
}
