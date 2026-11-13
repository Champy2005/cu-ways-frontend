import VerifiedPerformancePage from "@/app/(app)/marketers/[id]/verified-performance/page";
import type { RawSearchParams } from "@/features/marketer-discovery/schemas";
import { requireSession } from "@/lib/auth/guards";

export default async function MyReviewsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const session = await requireSession();
  const query = await searchParams;
  return (
    <VerifiedPerformancePage
      params={Promise.resolve({ id: String(session.userId) })}
      searchParams={Promise.resolve({ ...query, ref: "marketer-dashboard" })}
    />
  );
}
