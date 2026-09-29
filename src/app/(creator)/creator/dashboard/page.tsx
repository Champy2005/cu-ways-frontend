import { InlineError } from "@/components/feedback/inline-error";
import { getDisplayError } from "@/lib/api/errors";
import { requireSession } from "@/lib/auth/guards";
import { getUser } from "@/features/users/api";
import { CreatorOverview } from "@/features/creators/components/creator-overview";

export const metadata = { title: "Creator overview | CU Ways" };

export default async function CreatorDashboardPage() {
  const session = await requireSession();
  let user;
  try {
    user = await getUser(session.userId);
  } catch (error) {
    return <InlineError message={getDisplayError(error)} />;
  }

  return <CreatorOverview name={user.name} />;
}
