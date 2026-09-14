"use client";

import { lazy, Suspense, useSyncExternalStore } from "react";
import { useLocalQuery } from "../local-navigation";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

import { getDemoView } from "../components/marketer-navigation";
import { getDemoSnapshot, getServerDemoSnapshot, resetDemo, subscribeDemo } from "./store";

const ProfileView = lazy(() => import("./profile-view"));
const DashboardView = lazy(() => import("./dashboard-view"));
const CatalogView = lazy(() => import("./catalog-view"));
const ViewerView = lazy(() => import("./viewer-view"));

const subscribeHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export function DemoWorkspace({ view }: { view: string }) {
  const hydrated = useSyncExternalStore(subscribeHydration, clientReady, serverReady);
  const state = useSyncExternalStore(subscribeDemo, getDemoSnapshot, getServerDemoSnapshot);
  const selected = getDemoView(useLocalQuery("view", view));
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
      <Suspense
        fallback={
          <p role="status" className="min-h-96 py-10">
            Loading preview...
          </p>
        }
      >
        <div key={`${selected}-${state.revision}`}>
          {selected === "dashboard" && <DashboardView state={state} />}
          {selected === "profile" && <ProfileView state={state} />}
          {selected === "services" && <CatalogView state={state} />}
          {selected === "viewer" && <ViewerView state={state} />}
        </div>
      </Suspense>
    </>
  );
}
