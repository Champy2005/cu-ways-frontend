import { InlineError } from "@/components/feedback/inline-error";
import { getDisplayError } from "@/lib/api/errors";
import { requireSession } from "@/lib/auth/guards";
import { getUser } from "@/features/users/api";
import { ContactSettings } from "@/features/users/components/contact-settings";

export default async function CreatorSettingsPage() {
  const session = await requireSession();
  let user;
  try {
    user = await getUser(session.userId);
  } catch (error) {
    return <InlineError message={getDisplayError(error)} />;
  }

  return <ContactSettings user={user} />;
}
