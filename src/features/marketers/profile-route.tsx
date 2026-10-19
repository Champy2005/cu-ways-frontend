import { requireSession } from "@/lib/auth/guards";
import { getMyProfile } from "@/features/marketers/api";
import { getUser } from "@/features/users/api";
import { LiveProfile } from "@/features/marketers/components/live-profile";
import { RouteFeedback } from "@/features/marketers/components/route-feedback";
import type { ProfileMode } from "@/features/marketers/types";
import { isMissingMarketerProfile, marketerFailure } from "@/features/marketers/failures";

/** Server boundary shared by profile settings and marketer account creation. */
export async function renderMarketerProfile(
  searchParams: Promise<{ tab?: string }>,
  mode: ProfileMode = "settings",
) {
  const session = await requireSession();
  const [professional, basic, query] = await Promise.allSettled([
    getMyProfile(),
    getUser(session.userId),
    searchParams,
  ]);
  const onboarding =
    professional.status === "rejected" && isMissingMarketerProfile(professional.reason);
  const professionalFailure =
    professional.status === "rejected" && !onboarding
      ? marketerFailure(professional.reason)
      : undefined;
  const contactFailure = basic.status === "rejected" ? marketerFailure(basic.reason) : undefined;
  for (const failure of [professionalFailure, contactFailure]) {
    if (failure && failure !== "unavailable") return <RouteFeedback kind={failure} />;
  }
  return (
    <LiveProfile
      mode={mode}
      profile={
        professional.status === "fulfilled"
          ? professional.value
          : onboarding && basic.status === "fulfilled"
            ? {
                ...basic.value,
                bio: "",
                experience_years: 0,
                availability_status: "available",
                availability_text: "",
                expertise: [],
                campuses: [],
              }
            : undefined
      }
      contact={basic.status === "fulfilled" ? basic.value : undefined}
      onboarding={onboarding}
      professionalFailure={professionalFailure}
      contactFailure={contactFailure}
      initialTab={query.status === "fulfilled" ? query.value.tab : undefined}
    />
  );
}
