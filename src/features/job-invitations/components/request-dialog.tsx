"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Invitation, InvitationActions } from "../types";
import { DECLINE_REASONS, MESSAGE_LIMIT } from "../validation";
import { formatPrice } from "../format";
import { Confirmation } from "./confirmation";
import { useAction } from "./use-action";

export function RequestDialog({
  request,
  mode,
  actions,
  onClose,
  onResponded,
  finalFocus,
}: {
  request: Invitation;
  mode: "accept" | "decline";
  actions: InvitationActions;
  onClose: () => void;
  onResponded: () => void;
  finalFocus: () => HTMLElement | null;
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
          ? "Are you sure you want to pass on this request? Let the creator know why (optional)."
          : "Accepting shows that you are interested. You can prepare and submit your custom offer next. You have not been hired yet."
      }
      confirmLabel={declining ? "Decline Request" : "Confirm"}
      cancelLabel={declining ? "Keep Invitation" : "Cancel"}
      destructive={declining}
      pending={action.pending}
      error={action.error}
      finalFocus={finalFocus}
      onClose={() => {
        if (!action.isPending()) onClose();
      }}
      onConfirm={() => {
        void action.run(
          () =>
            declining ? actions.decline(request.id, { reason, note }) : actions.accept(request.id),
          onResponded,
        );
      }}
    >
      {declining ? (
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
          <Label htmlFor="decline-note">Note (optional)</Label>
          <Textarea
            id="decline-note"
            placeholder="Add a polite note"
            value={note}
            maxLength={MESSAGE_LIMIT}
            onChange={(event) => setNote(event.target.value)}
            className="ji-input"
          />
          <p className="ji-muted ji-counter">
            {note.length}/{MESSAGE_LIMIT}
          </p>
        </fieldset>
      ) : (
        <div className="ji-inset">
          <strong>{request.job.title}</strong>
          <p className="ji-accent">{formatPrice(request.job.budget)} fixed</p>
        </div>
      )}
    </Confirmation>
  );
}
