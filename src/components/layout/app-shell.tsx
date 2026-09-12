import Link from "next/link";

import type { SessionRole } from "@/lib/auth/token";
import { LogoutButton } from "@/components/layout/logout-button";

const navLinkClass = "rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100";

type AppShellProps = {
  children: React.ReactNode;
  role: SessionRole;
};

export function AppShell({ children, role }: AppShellProps) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="shrink-0 text-lg font-bold tracking-tight text-zinc-950"
          >
            CU Ways
          </Link>
          {/* Scrolls rather than widening the document; the nav has no mobile menu yet. */}
          <nav
            className="flex min-w-0 items-center gap-1 overflow-x-auto"
            aria-label="Main navigation"
          >
            <Link className={navLinkClass} href="/dashboard">
              Dashboard
            </Link>
            <Link className={navLinkClass} href="/profile">
              Profile
            </Link>
            <Link className={navLinkClass} href="/marketers">
              Marketers
            </Link>
            <Link className={navLinkClass} href="/surveys">
              Surveys
            </Link>
            <Link className={navLinkClass} href="/jobs">
              Jobs
            </Link>
            {role === "admin" ? (
              <Link className={navLinkClass} href="/admin/users">
                Users
              </Link>
            ) : null}
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}
