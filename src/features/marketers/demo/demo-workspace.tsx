"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Home, Briefcase, UserRound, Eye, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileForm } from "../components/profile-form";
import { PerformanceDashboard, type RecentJob } from "../components/performance-dashboard";
import { ServiceCatalog } from "../components/service-catalog";
import {
  demoActions,
  getDemoSnapshot,
  getServerDemoSnapshot,
  resetDemo,
  subscribeDemo,
} from "./store";

const views = [
  { id: "dashboard", label: "Overview", icon: Home },
  { id: "services", label: "Services", icon: Briefcase },
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "viewer", label: "Creator view", icon: Eye },
] as const;

const recentJobs: RecentJob[] = [
  { id: 1, title: "Campus Food Survey", date: "2026-09-02", status: "Completed", price: "250.00" },
  {
    id: 2,
    title: "Student Travel Habits",
    date: "2026-09-04",
    status: "In Progress",
    price: "400.00",
  },
];

const subscribeHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export function DemoWorkspace({ view }: { view: string }) {
  const hydrated = useSyncExternalStore(subscribeHydration, clientReady, serverReady);
  const state = useSyncExternalStore(subscribeDemo, getDemoSnapshot, getServerDemoSnapshot);
  const selected = views.some((entry) => entry.id === view) ? view : "dashboard";
  // Forms keep their own editing state. Mount them only after session data is available.
  if (!hydrated)
    return (
      <p role="status" className="py-10 text-sm text-[var(--mk-muted)]">
        Loading demo…
      </p>
    );
  return (
    <>
      <aside className="mb-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--mk-border)] bg-[var(--mk-surface)] px-4 py-3">
        <div>
          <span className="mr-2 rounded-md bg-[var(--mk-accent)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--mk-bg)]">
            Demo
          </span>
          <span className="text-xs text-[var(--mk-muted)]">
            Demo data — changes stay in this browser session.
          </span>
        </div>
        <Button variant="ghost" className="text-xs text-[var(--mk-muted)]" onClick={resetDemo}>
          <RotateCcw size={13} />
          Reset demo
        </Button>
      </aside>
      <nav aria-label="Demo views" className="mb-8 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {views.map(({ id, label, icon: Icon }) => (
          <Link
            key={id}
            href={`/demo/marketer?view=${id}`}
            aria-current={selected === id ? "page" : undefined}
            className="mk-nav-link flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs sm:text-sm"
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>
      <div key={`${selected}-${state.revision}`}>
        {selected === "dashboard" && (
          <PerformanceDashboard
            profile={state.profile}
            stats={state.stats}
            recentJobs={recentJobs}
          />
        )}
        {selected === "profile" && (
          <ProfileForm profile={state.profile} onSave={demoActions.saveProfile} />
        )}
        {selected === "services" && (
          <ServiceCatalog
            services={state.services}
            marketer={state.profile}
            actions={demoActions}
          />
        )}
        {selected === "viewer" && (
          <>
            <p className="mb-5 text-xs text-[var(--mk-muted)]">
              Creator preview · Published service catalog
            </p>
            <ServiceCatalog
              services={state.services}
              marketer={{ user_id: state.profile.user_id, name: state.profile.name }}
            />
          </>
        )}
      </div>
    </>
  );
}
