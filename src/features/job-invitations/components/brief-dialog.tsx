"use client";

import { useRef } from "react";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogPopup,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Invitation } from "../types";

export function BriefDialog({
  request,
  onClose,
  finalFocus,
}: {
  request: Invitation;
  onClose: () => void;
  finalFocus: () => HTMLElement | null;
}) {
  const container = useRef<HTMLDivElement>(null);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <div ref={container} />
      <DialogPortal container={container}>
        <DialogOverlay className="mk-dialog-backdrop fixed inset-0 z-[60]" />
        <DialogPopup className="ji-modal mk-dialog-surface" finalFocus={finalFocus}>
          <DialogTitle className="ji-modal-title">{request.job.brief.title}</DialogTitle>
          <DialogDescription className="ji-muted ji-modal-description">
            {request.job.title} · Fictional preview brief
          </DialogDescription>
          <p className="ji-message leading-7">{request.job.brief.text}</p>
          <Button className="ji-primary mt-6 w-full" onClick={onClose}>
            Close brief
          </Button>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
