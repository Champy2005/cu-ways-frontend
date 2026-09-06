import { FeaturePlaceholder } from "@/components/feedback/feature-placeholder";

export default async function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <FeaturePlaceholder
      eyebrow={`Job #${id}`}
      title="Job details"
      description="Job detail and offer flows will be implemented in the jobs feature module."
    />
  );
}
