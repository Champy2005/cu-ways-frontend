"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, LoaderCircle } from "lucide-react";
import "./pull-to-refresh.css";

const threshold = 64;

function atTop(element: HTMLElement): boolean {
  if (window.scrollY > 0) return false;
  for (let parent: HTMLElement | null = element; parent; parent = parent.parentElement) {
    if (parent.scrollTop > 0) return false;
  }
  return true;
}

export function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
}: {
  children: ReactNode;
  onRefresh: () => Promise<boolean>;
  disabled?: boolean;
}) {
  const region = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [failure, setFailure] = useState("");

  useEffect(() => {
    const element = region.current;
    if (!element) return;
    let origin: { x: number; y: number } | null = null;
    let pulled = 0;
    function cancel() {
      origin = null;
      pulled = 0;
      setDistance(0);
    }
    function start(event: TouchEvent) {
      cancel();
      if (disabled || inFlight.current || event.touches.length !== 1 || !atTop(element!)) return;
      if (
        event.target instanceof Element &&
        event.target.closest("input, textarea, select, button, a")
      )
        return;
      origin = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      setFailure("");
    }
    function move(event: TouchEvent) {
      if (!origin) return;
      if (event.touches.length !== 1 || !atTop(element!)) {
        cancel();
        return;
      }
      const dy = event.touches[0].clientY - origin.y;
      const dx = Math.abs(event.touches[0].clientX - origin.x);
      if (dy < 0 || (dx > 8 && dx > dy)) {
        cancel();
        return;
      }
      if (dy <= dx) return;
      if (event.cancelable) event.preventDefault();
      pulled = Math.min(dy / 2, 96);
      setDistance(pulled);
    }
    async function refresh() {
      inFlight.current = true;
      setRefreshing(true);
      try {
        await onRefresh();
      } catch {
        setFailure("Invitations could not be refreshed. Please try again.");
      } finally {
        inFlight.current = false;
        setRefreshing(false);
      }
    }
    function end() {
      const ready = origin && pulled >= threshold && !inFlight.current && !disabled;
      cancel();
      if (ready) void refresh();
    }
    element.addEventListener("touchstart", start, { passive: true });
    element.addEventListener("touchmove", move, { passive: false });
    element.addEventListener("touchend", end);
    element.addEventListener("touchcancel", cancel);
    return () => {
      element.removeEventListener("touchstart", start);
      element.removeEventListener("touchmove", move);
      element.removeEventListener("touchend", end);
      element.removeEventListener("touchcancel", cancel);
    };
  }, [disabled, onRefresh]);

  return (
    <div
      ref={region}
      role="region"
      aria-label="Invitation list"
      aria-busy={refreshing}
      className="ji-pull-region"
    >
      {(distance > 0 || refreshing) && (
        <div
          role="status"
          className="ji-pull-indicator"
          style={{ height: refreshing ? 44 : distance }}
        >
          {refreshing ? (
            <LoaderCircle size={16} className="motion-safe:animate-spin" aria-hidden="true" />
          ) : (
            <ArrowDown size={16} aria-hidden="true" />
          )}
          {refreshing
            ? "Refreshing invitations…"
            : distance >= threshold
              ? "Release to refresh"
              : "Pull to refresh"}
        </div>
      )}
      {failure && (
        <p role="alert" className="ji-muted">
          {failure}
        </p>
      )}
      {children}
    </div>
  );
}
