import { requireSession } from "@/lib/auth/guards";
import { getMyProfile, getMyStats } from "@/features/marketers/api";
import { PerformanceDashboard } from "@/features/marketers/components/performance-dashboard";
import { RouteFeedback } from "@/features/marketers/components/route-feedback";
import { marketerFailure } from "@/features/marketers/failures";

export const metadata = { title: "Marketer overview | CU Ways" };

export default async function MarketerDashboardPage() {
  await requireSession();
  const [profileResult, statsResult] = await Promise.allSettled([getMyProfile(), getMyStats()]);
  if (profileResult.status === "rejected")
    return <RouteFeedback kind={marketerFailure(profileResult.reason)} />;
  if (statsResult.status === "rejected") {
    const kind = marketerFailure(statsResult.reason);
    if (kind !== "unavailable") return <RouteFeedback kind={kind} />;
  }
  const profile = profileResult.value;
  const stats = statsResult.status === "fulfilled" ? statsResult.value : null;
  return (
    <>
      <PerformanceDashboard
        profile={profile}
        stats={stats}
        statsError="Performance summaries are not available yet."
      />
    </>
  );
}
