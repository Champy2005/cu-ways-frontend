import { requireSession } from "@/lib/auth/guards";
import { getMyProfile, getMyServices } from "@/features/marketers/api";
import { LiveCatalog } from "@/features/marketers/components/live-catalog";
import { RouteFeedback } from "@/features/marketers/components/route-feedback";
import { marketerFailure } from "@/features/marketers/failures";

export const metadata = { title: "Your service catalog | CU Ways" };

export default async function MarketerServicesPage() {
  await requireSession();
  let profile, services;
  try {
    [profile, services] = await Promise.all([getMyProfile(), getMyServices()]);
  } catch (error) {
    return <RouteFeedback kind={marketerFailure(error)} />;
  }
  return <LiveCatalog profile={profile} services={services} />;
}
