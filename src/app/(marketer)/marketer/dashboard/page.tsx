import { requireSession } from "@/lib/auth/guards";
import { getMyProfile, getMyStats } from "@/features/marketers/api";
import { PerformanceDashboard } from "@/features/marketers/components/performance-dashboard";
import { RouteFeedback } from "@/features/marketers/components/route-feedback";
import { marketerFailure } from "@/features/marketers/failures";
import { RefreshStats } from "@/features/marketers/components/refresh-stats";

export const metadata = { title: "Marketer overview | CU Ways" };

export default async function MarketerDashboardPage() {
  await requireSession();
  let profile;
  try {
    profile = await getMyProfile();
  } catch (error) {
    return <RouteFeedback kind={marketerFailure(error)} />;
  }
  let stats = null;
  try {
    stats = await getMyStats();
  } catch (error) {
    const kind = marketerFailure(error);
    if (kind === "unauthorized" || kind === "forbidden") return <RouteFeedback kind={kind} />;
  }
  return (
    <>
      <PerformanceDashboard
        profile={profile}
        stats={stats}
        statsError="Your performance summary is temporarily unavailable. Please try again shortly."
      />
      {!stats && <RefreshStats />}
    </>
  );
}
