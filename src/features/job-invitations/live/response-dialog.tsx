"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Confirmation } from "../components/confirmation";
import { useAction } from "../components/use-action";
import { DECLINE_REASONS } from "../validation";
import type { DeclineInput } from "../types";
import { characterCount } from "./validation";
import { JobIdentity } from "./presentation";
import type { ReceivedRequest } from "./types";

export function ResponseDialog({
  mode,
  onRespond,
  onClose,
  finalFocus,
  disabled,
  request,
}: {
  mode: "accept" | "decline";
  onRespond: (input?: DeclineInput) => Promise<void>;
  onClose: () => void;
  finalFocus: () => HTMLElement | null;
  disabled: boolean;
  request?: ReceivedRequest;
}) {
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const action = useAction();
  const declining = mode === "decline";
  return (
    <Confirmation
      title={declining ? "Decline Invitation" : "Accept Job Invitation?"}
      description={
        declining
          ? "You can optionally explain why you are declining."
          : "Accepting signals interest. You can submit an offer next; you have not been hired yet."
      }
      confirmLabel={declining ? "Decline Request" : "Confirm"}
      cancelLabel={declining ? "Keep Invitation" : "Cancel"}
      destructive={declining}
      pending={action.pending}
      confirmDisabled={disabled || characterCount(note.trim()) > 300}
      error={action.error}
      onDismissError={action.dismissError}
      onClose={onClose}
      finalFocus={finalFocus}
      onConfirm={() => {
        if (characterCount(note.trim()) > 300) return;
        void action.run(() => onRespond(declining ? { reason, note } : undefined), onClose);
      }}
    >
      {request && (
        <div className="ji-inset">
          <JobIdentity request={request} />
        </div>
      )}
      {declining && (
        <fieldset disabled={action.pending} className="ji-decline-fields">
          <legend className="sr-only">Optional decline explanation</legend>
          <div className="ji-reasons">
            {DECLINE_REASONS.map((value) => (
              <Button
                key={value}
                variant="outline"
                aria-pressed={reason === value}
                onClick={() => setReason(reason === value ? null : value)}
              >
                {value}
              </Button>
            ))}
          </div>
          <Label htmlFor="live-decline-note">Note (optional)</Label>
          <Textarea
            id="live-decline-note"
            className="ji-input"
            placeholder="Add a polite note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            aria-invalid={characterCount(note.trim()) > 300}
            aria-describedby="live-decline-count"
          />
          <p id="live-decline-count" className="ji-muted ji-counter">
            {characterCount(note.trim())}/300 characters
            {characterCount(note.trim()) > 300
              ? ". Keep your note to 300 characters or fewer."
              : ""}
          </p>
        </fieldset>
      )}
    </Confirmation>
  );
}
