import { InlineError } from "@/components/feedback/inline-error";
import { getDisplayError } from "@/lib/api/errors";
import { getUser } from "@/features/users/api";
import { UserProfileCard } from "@/features/users/components/user-profile-card";

export default async function AdminUserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userID = Number(id);
  if (!Number.isSafeInteger(userID) || userID < 1) {
    return <InlineError title="Invalid user" message="The user ID is not valid." />;
  }

  let user;
  try {
    user = await getUser(userID);
  } catch (error) {
    return <InlineError message={getDisplayError(error)} />;
  }

  return <UserProfileCard user={user} />;
}
