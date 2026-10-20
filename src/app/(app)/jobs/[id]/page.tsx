import { redirect } from "next/navigation";
export default async function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/creator/jobs/${encodeURIComponent(id)}`);
}
