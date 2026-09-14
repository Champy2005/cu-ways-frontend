import { ApiError } from "@/lib/api/errors";
import { EmptyState } from "@/components/feedback/empty-state";
import { requireSession } from "@/lib/auth/guards";
import { getPublicCatalog } from "@/features/marketers/api";
import { PublicServiceCatalog } from "@/features/marketers/components/public-service-catalog";
import { RouteFeedback } from "@/features/marketers/components/route-feedback";
import { marketerFailure } from "@/features/marketers/failures";

export const metadata = { title: "Service catalog | CU Ways" };

export default async function PublicCatalogPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)))
    return <RouteFeedback kind="missing" />;
  let catalog;
  try {
    catalog = await getPublicCatalog(Number(id));
  } catch (error) {
    if (error instanceof ApiError && error.code === "feature_unavailable")
      return (
        <EmptyState
          title="Service catalog coming soon"
          description="Public service catalogs are not available yet."
        />
      );
    return <RouteFeedback kind={marketerFailure(error)} />;
  }
  return <PublicServiceCatalog {...catalog} />;
}
