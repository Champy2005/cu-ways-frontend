"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { NotificationToast } from "../components/notification-toast";
import { createNotification } from "../notifications";

export function StatusFeedback({
  message,
  status,
  onRefresh,
  retry = false,
  pending = false,
  onDismiss,
}: {
  message: string;
  status?: number;
  onRefresh: () => void;
  retry?: boolean;
  pending?: boolean;
  onDismiss: () => void;
}) {
  const notification = useMemo(
    () => (message ? createNotification(message, "success") : null),
    [message],
  );
  if (!retry && status === undefined)
    return <NotificationToast notification={notification} onDismiss={onDismiss} />;
  return (
    <div className="my-4 space-y-2 text-sm">
      <p role="alert">{message || "Offers could not be loaded. Please try again."}</p>
      {status === 401 ? (
        <Link href="/login" className="ji-accent underline">
          Sign in again
        </Link>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="ji-accent h-auto px-0 underline"
          onClick={onRefresh}
          disabled={pending}
        >
          {pending ? "Retrying…" : "Try again"}
        </Button>
      )}
      {status === 403 && (
        <Link href="/marketer/profile" className="ml-4 ji-accent underline">
          Open marketer profile
        </Link>
      )}
    </div>
  );
}
