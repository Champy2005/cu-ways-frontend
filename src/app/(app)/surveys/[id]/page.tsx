import { FeaturePlaceholder } from "@/components/feedback/feature-placeholder";

export default async function SurveyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <FeaturePlaceholder
      eyebrow={`Survey #${id}`}
      title="Survey details"
      description="Survey detail and submission flows will be implemented in the surveys feature module."
    />
  );
}
