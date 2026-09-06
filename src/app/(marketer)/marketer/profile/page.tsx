import { requireSession } from "@/lib/auth/guards";
import { getMyProfile } from "@/features/marketers/api";
import { LiveProfile } from "@/features/marketers/components/live-profile";
import { RouteFeedback } from "@/features/marketers/components/route-feedback";
import { marketerFailure } from "@/features/marketers/failures";

export const metadata = { title: "Professional profile | CU Ways" };

export default async function MarketerProfilePage() {
  await requireSession();
  let profile;
  try {
    profile = await getMyProfile();
  } catch (error) {
    return <RouteFeedback kind={marketerFailure(error)} />;
  }
  return <LiveProfile profile={profile} />;
}
