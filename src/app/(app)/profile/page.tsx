import { InlineError } from "@/components/feedback/inline-error";
import { getDisplayError } from "@/lib/api/errors";
import { requireSession } from "@/lib/auth/guards";
import { getUser } from "@/features/users/api";
import { UserProfileCard } from "@/features/users/components/user-profile-card";

export default async function ProfilePage() {
  const session = await requireSession();
  let user;
  try {
    user = await getUser(session.userId);
  } catch (error) {
    return <InlineError message={getDisplayError(error)} />;
  }

  return <UserProfileCard user={user} />;
}
