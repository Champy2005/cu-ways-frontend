"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FeatureNotification } from "../notifications";

export function NotificationToast({
  notification,
  onDismiss,
}: {
  notification: FeatureNotification | null;
  onDismiss: () => void;
}) {
  const error = notification?.kind === "error";
  return (
    <div
      role={error ? "alert" : "status"}
      aria-live={error ? "assertive" : "polite"}
      aria-atomic="true"
      className="ji-toast-region"
    >
      {notification && (
        <ToastContent key={notification.id} notification={notification} onDismiss={onDismiss} />
      )}
    </div>
  );
}

function ToastContent({
  notification,
  onDismiss,
}: {
  notification: FeatureNotification;
  onDismiss: () => void;
}) {
  const message = notification.message;
  const error = notification.kind === "error";
  const [closing, setClosing] = useState(false);
  const isClosing = useRef(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remaining = useRef(5000);
  const started = useRef(0);
  const hovered = useRef(false);
  const focused = useRef(false);
  const dismiss = useCallback(() => {
    if (isClosing.current) return;
    isClosing.current = true;
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      onDismiss();
      return;
    }
    setClosing(true);
    exitTimer.current = setTimeout(() => {
      exitTimer.current = null;
      onDismiss();
    }, 180);
  }, [onDismiss]);

  function pause() {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
      remaining.current = Math.max(0, remaining.current - (Date.now() - started.current));
    }
  }
  function resume() {
    if (isClosing.current || hovered.current || focused.current || timer.current !== null) return;
    started.current = Date.now();
    timer.current = setTimeout(dismiss, remaining.current);
  }
  useEffect(() => {
    remaining.current = 5000;
    if (!isClosing.current && !hovered.current && !focused.current) {
      started.current = Date.now();
      timer.current = setTimeout(dismiss, remaining.current);
    }
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
      if (exitTimer.current !== null) clearTimeout(exitTimer.current);
      timer.current = null;
    };
  }, [dismiss]);

  return (
    <div
      className="ji-feedback ji-toast"
      data-error={error}
      data-closing={closing}
      onMouseEnter={() => {
        hovered.current = true;
        pause();
      }}
      onMouseLeave={() => {
        hovered.current = false;
        resume();
      }}
      onFocus={() => {
        focused.current = true;
        pause();
      }}
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget)) return;
        focused.current = false;
        resume();
      }}
    >
      {error ? (
        <CircleAlert size={20} aria-hidden="true" />
      ) : (
        <CheckCircle2 size={20} aria-hidden="true" />
      )}
      <div>{message}</div>
      <Button variant="ghost" size="icon" aria-label="Dismiss notification" onClick={dismiss}>
        <X size={16} aria-hidden="true" />
      </Button>
    </div>
  );
}
