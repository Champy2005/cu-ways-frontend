import { requireSession } from "@/lib/auth/guards";
import { getMyProfile } from "@/features/marketers/api";
import { getUser } from "@/features/users/api";
import { LiveProfile } from "@/features/marketers/components/live-profile";
import { RouteFeedback } from "@/features/marketers/components/route-feedback";
import { marketerFailure } from "@/features/marketers/failures";

export const metadata = { title: "Profile settings | CU Ways" };
export default async function MarketerProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireSession();
  const [professional, basic, query] = await Promise.allSettled([
    getMyProfile(),
    getUser(session.userId),
    searchParams,
  ]);
  const professionalFailure =
    professional.status === "rejected" ? marketerFailure(professional.reason) : undefined;
  const contactFailure = basic.status === "rejected" ? marketerFailure(basic.reason) : undefined;
  for (const failure of [professionalFailure, contactFailure]) {
    if (failure && failure !== "unavailable") return <RouteFeedback kind={failure} />;
  }
  return (
    <LiveProfile
      profile={professional.status === "fulfilled" ? professional.value : undefined}
      contact={basic.status === "fulfilled" ? basic.value : undefined}
      professionalFailure={professionalFailure}
      contactFailure={contactFailure}
      initialTab={query.status === "fulfilled" ? query.value.tab : undefined}
    />
  );
}
