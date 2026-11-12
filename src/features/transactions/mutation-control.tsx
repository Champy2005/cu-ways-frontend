"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useRef, useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { NotificationToast } from "@/components/feedback/success-toast";
import { Confirmation } from "@/features/job-invitations/components/confirmation";
import "@/features/job-invitations/invitations.css";
import { saveJobMutation } from "./actions";
import type { JobMutation } from "./types";

type MutationPrompt = {
  mutation: JobMutation;
  title: string;
  description: string;
  confirmLabel: string;
  success: string;
};

const FeedbackContext = createContext<(message: string) => void>(() => {});

export function MutationFeedback({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<{
    id: number;
    kind: "success";
    message: string;
  } | null>(null);
  return (
    <FeedbackContext
      value={(message) => setNotification({ id: Date.now(), kind: "success", message })}
    >
      {children}
      <NotificationToast notification={notification} onDismiss={() => setNotification(null)} />
    </FeedbackContext>
  );
}

export function MutationControl({
  jobId,
  children,
}: {
  jobId: number;
  children: (ask: (prompt: MutationPrompt) => void, disabled: boolean) => ReactNode;
}) {
  const router = useRouter();
  const [prompt, setPrompt] = useState<MutationPrompt | null>(null);
  const [message, setMessage] = useState("");
  const notify = useContext(FeedbackContext);
  const [blocked, setBlocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const inFlight = useRef(false);
  const [trigger, setTrigger] = useState<HTMLElement | null>(null);

  function ask(next: MutationPrompt) {
    if (saving || blocked || refreshing) return;
    setTrigger(document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setMessage("");
    setPrompt(next);
  }

  async function confirm() {
    if (!prompt || inFlight.current || blocked) return;
    inFlight.current = true;
    setSaving(true);
    setMessage("");
    try {
      const result = await saveJobMutation(String(jobId), prompt.mutation);
      if (result.status === "saved") {
        setPrompt(null);
        notify(prompt.success);
        startRefresh(() => router.refresh());
      } else {
        setBlocked(result.status === "reconcile");
        setMessage(result.message);
      }
    } catch {
      setBlocked(true);
      setMessage(
        "The result could not be confirmed. Reload the page to check the saved record before trying again.",
      );
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }

  return (
    <>
      {children(ask, saving || blocked || refreshing)}
      {!prompt && message && <p role="alert">{message}</p>}
      {!prompt && blocked && (
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reload page
        </Button>
      )}
      {prompt && (
        <Confirmation
          title={prompt.title}
          description={prompt.description}
          confirmLabel={prompt.confirmLabel}
          cancelLabel="Go back"
          pending={saving}
          confirmDisabled={blocked}
          onConfirm={confirm}
          onClose={() => setPrompt(null)}
          finalFocus={() => trigger}
        >
          {message && (
            <p role="alert" className="my-3 text-sm text-[var(--mk-error)]">
              {message}
            </p>
          )}
          {blocked && (
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reload page
            </Button>
          )}
        </Confirmation>
      )}
    </>
  );
}
