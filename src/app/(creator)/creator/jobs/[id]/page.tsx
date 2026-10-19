import { InlineError } from "@/components/feedback/inline-error";
import { JobDraftPage } from "@/features/jobs/components/job-draft-page";
import { getUser } from "@/features/users/api";
import { getDisplayError } from "@/lib/api/errors";
import { requireSession } from "@/lib/auth/guards";

export const metadata = { title: "Job details | CU Ways" };

export default async function CreatorJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ preview?: string | string[] }>;
}) {
  const session = await requireSession();
  let creatorName: string;
  try {
    creatorName = (await getUser(session.userId)).name;
  } catch (error) {
    return <InlineError message={getDisplayError(error)} />;
  }
  const [{ id }, { preview }] = await Promise.all([params, searchParams]);
  // UI-only preview until the saved offer status is connected.
  return (
    <JobDraftPage jobId={id} creatorName={creatorName} previewAccepted={preview === "accepted"} />
  );
}
