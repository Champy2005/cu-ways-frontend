import { ReviewPage } from "@/features/transactions/workflow-page";

export const metadata = { title: "Job review | CU Ways" };

export default async function JobReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReviewPage id={id} />;
}
