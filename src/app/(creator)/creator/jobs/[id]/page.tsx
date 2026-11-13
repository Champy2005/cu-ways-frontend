import { InlineError } from "@/components/feedback/inline-error";
import { JobDraftPage } from "@/features/jobs/components/job-draft-page";
import { JobCancellation } from "@/features/jobs/components/job-cancellation";
import { MutationFeedback } from "@/features/transactions/mutation-control";
import { getJobWorkflow } from "@/features/transactions/queries";
import { CreatorWorkflow, WorkflowError } from "@/features/transactions/workflow-page";
import { CompleteJob } from "@/features/transactions/workflow-controls";
import { getUser } from "@/features/users/api";
import { ApiError, getDisplayError } from "@/lib/api/errors";
import { requireSession } from "@/lib/auth/guards";

export const metadata = { title: "Job details | CU Ways" };

export default async function CreatorJobPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  let creatorName: string;
  try {
    creatorName = (await getUser(session.userId)).name;
  } catch (error) {
    return <InlineError message={getDisplayError(error)} />;
  }
  const { id } = await params;
  const result = await getJobWorkflow(id, session.userId, "creator").then(
    (workflow) => ({ workflow, error: null }),
    (error: unknown) => ({ workflow: null, error }),
  );
  const showError =
    result.error !== null &&
    !(
      result.error instanceof ApiError &&
      (result.error.code === "accepted_offer_required" ||
        [403, 404, 422].includes(result.error.status))
    );
  return (
    <>
      <MutationFeedback>
        <JobDraftPage
          key={result.workflow?.job.job_status}
          jobId={id}
          creatorName={creatorName}
          completion={
            result.workflow &&
            result.workflow.job.job_status === "In Progress" &&
            result.workflow.job.payment?.amount === result.workflow.job.accepted_price &&
            result.workflow.proofs.length > 0 ? (
              <CompleteJob job={result.workflow.job} />
            ) : undefined
          }
        />
        {result.workflow && <CreatorWorkflow {...result.workflow} />}
        {showError && <WorkflowError error={result.error} />}
      </MutationFeedback>
      <JobCancellation
        jobId={id}
        creatorId={session.userId}
        status={result.workflow?.job.job_status}
      />
    </>
  );
}
