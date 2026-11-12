import { MarketerJobPage } from "@/features/transactions/workflow-page";

export const metadata = { title: "Job details | CU Ways" };

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MarketerJobPage id={id} />;
}
