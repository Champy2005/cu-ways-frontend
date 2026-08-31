import { AppShell } from "@/components/layout/app-shell";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAdmin();
  return <AppShell role={session.role}>{children}</AppShell>;
}
