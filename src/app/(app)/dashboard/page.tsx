import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/guards";
import { WORKSPACE_COOKIE } from "@/lib/auth/workspace";
import { getMyProfile } from "@/features/marketers/api";
export default async function DashboardPage() {
  const session = await requireSession();
  if (session.role === "admin") redirect("/admin");
  const preference = (await cookies()).get(WORKSPACE_COOKIE)?.value;
  if (preference === `${session.userId}:Creator`) redirect("/creator/dashboard");
  let marketer = false;
  try {
    await getMyProfile();
    marketer = true;
  } catch {
    /* New users start as Creators. */
  }
  redirect(marketer ? "/marketer/dashboard" : "/creator/dashboard");
}
