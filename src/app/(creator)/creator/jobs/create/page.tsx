import { CreateJobForm } from "@/features/jobs/components/create-job-form";
import { JobDraftPage } from "@/features/jobs/components/job-draft-page";

export const metadata = { title: "Create Job | CU Ways" };

export default async function CreateJobPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string | string[] }>;
}) {
  const { edit } = await searchParams;
  return typeof edit === "string" ? <JobDraftPage jobId={edit} edit /> : <CreateJobForm />;
}
