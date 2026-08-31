import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/lib/auth/guards";

export default async function AuthenticatedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await requireSession();
  return <AppShell role={session.role}>{children}</AppShell>;
}
