import { Inter } from "next/font/google";

import { InlineError } from "@/components/feedback/inline-error";
import { getDisplayError } from "@/lib/api/errors";
import { requireSession } from "@/lib/auth/guards";
import { getUser } from "@/features/users/api";
import { ContactSettings } from "@/features/users/components/contact-settings";

const inter = Inter({ subsets: ["latin"] });

export default async function ProfilePage() {
  const session = await requireSession();
  let user;
  try {
    user = await getUser(session.userId);
  } catch (error) {
    return <InlineError message={getDisplayError(error)} />;
  }

  return (
    <div className={inter.className}>
      <ContactSettings user={user} />
    </div>
  );
}
