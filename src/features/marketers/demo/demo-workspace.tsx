"use client";

import { useSyncExternalStore } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileForm } from "../components/profile-form";
import { PerformanceDashboard, type RecentJob } from "../components/performance-dashboard";
import { ServiceCatalog } from "../components/service-catalog";
import { getDemoView, MarketerNavigation } from "../components/marketer-navigation";
import {
  demoActions,
  getDemoSnapshot,
  getServerDemoSnapshot,
  resetDemo,
  subscribeDemo,
} from "./store";

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
  const selected = getDemoView(view);
  // Forms keep their own editing state. Mount them only after session data is available.
  if (!hydrated)
    return (
      <p role="status" className="py-10 text-sm text-[var(--mk-muted)]">
        Loading demo…
      </p>
    );
  return (
    <>
      <aside className="mk-demo-banner">
        <div className="flex min-w-0 items-center gap-3">
          <span className="mk-demo-badge">Demo</span>
          <span className="text-xs leading-5 text-[var(--mk-muted)]">
            Demo data — changes stay in this browser session.
          </span>
        </div>
        <Button
          variant="ghost"
          className="mk-reset-demo text-xs text-[var(--mk-muted)]"
          aria-label="Reset demo"
          onClick={resetDemo}
        >
          <RotateCcw size={13} />
          <span>Reset demo</span>
        </Button>
      </aside>
      <MarketerNavigation demo selected={selected} />
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
