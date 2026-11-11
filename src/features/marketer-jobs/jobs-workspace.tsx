"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { NotificationToast } from "@/components/feedback/success-toast";
import { startHiredJob } from "./actions";
import type { StartResult } from "./types";

type Operation = { jobId: number; phase: "pending" | "unknown" | "settled"; result?: StartResult };
const WorkspaceContext = createContext<{
  operation: Operation | null;
  busy: boolean;
  start: (id: number) => Promise<void>;
  clear: () => void;
} | null>(null);
const markerEvent = "cuways-job-start-check";
const markerKey = (id: number) => `cuways:job-start:${id}`;

function markUncertain(id: number, uncertain: boolean) {
  try {
    if (uncertain) sessionStorage.setItem(markerKey(id), "check");
    else sessionStorage.removeItem(markerKey(id));
  } catch {
    // In-memory operation state still prevents duplicate submission.
  }
  window.dispatchEvent(new Event(markerEvent));
}

function subscribeMarker(listener: () => void) {
  window.addEventListener(markerEvent, listener);
  return () => window.removeEventListener(markerEvent, listener);
}

export function useStartNeedsCheck(id: number) {
  return useSyncExternalStore(
    subscribeMarker,
    () => {
      try {
        return sessionStorage.getItem(markerKey(id)) === "check";
      } catch {
        return false;
      }
    },
    () => false,
  );
}

export function clearStartCheck(id: number) {
  markUncertain(id, false);
}

/** Lives above both routes so dismissing a dialog or opening My Jobs keeps the
 * dispatched operation alive. Reloads retain only a check marker, never private data or POST intent. */
export function JobsWorkspace({ children }: { children: ReactNode }) {
  const [operation, setOperation] = useState<Operation | null>(null);
  const active = useRef(false);
  const [busy, setBusy] = useState(false);
  const [notification, setNotification] = useState<{
    id: number;
    kind: "success";
    title: string;
    message: string;
  } | null>(null);

  async function start(id: number) {
    if (active.current) return;
    active.current = true;
    setBusy(true);
    markUncertain(id, true);
    setOperation({ jobId: id, phase: "pending" });
    const deadline = setTimeout(() => {
      setOperation({ jobId: id, phase: "unknown", result: { status: "recheck" } });
    }, 12_000);
    let result: StartResult;
    try {
      result = await startHiredJob(String(id));
    } catch {
      result = { status: "recheck" };
    } finally {
      clearTimeout(deadline);
      active.current = false;
      setBusy(false);
    }
    if (result.status !== "recheck") markUncertain(id, false);
    setOperation({ jobId: id, phase: result.status === "recheck" ? "unknown" : "settled", result });
    if (result.status === "started") {
      setNotification({
        id: Date.now(),
        kind: "success",
        title: "Job started",
        message: "Status changed to In Progress.",
      });
    }
  }

  return (
    <WorkspaceContext
      value={{
        operation,
        busy,
        start,
        clear: () => {
          if (!active.current) setOperation(null);
        },
      }}
    >
      {children}
      <NotificationToast notification={notification} onDismiss={() => setNotification(null)} />
    </WorkspaceContext>
  );
}

export function useJobsWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("JobsWorkspace must wrap the jobs routes.");
  return context;
}
