"use client";

import { useRef, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Feedback } from "./shared";

export function Confirmation({
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = "Cancel",
  pending = false,
  error,
  destructive = false,
  onConfirm,
  onClose,
  finalFocus,
}: {
  title: string;
  description: string;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  pending?: boolean;
  error?: string | null;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  finalFocus?: () => HTMLElement | null;
}) {
  const container = useRef<HTMLDivElement>(null);
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <div ref={container} />
      <AlertDialogPortal container={container}>
        <AlertDialogOverlay className="mk-dialog-backdrop fixed inset-0 z-[60]" />
        <AlertDialogPopup className="ji-modal mk-dialog-surface" finalFocus={finalFocus}>
          <AlertDialogTitle className="ji-modal-title">{title}</AlertDialogTitle>
          <AlertDialogDescription className="ji-muted ji-modal-description">
            {description}
          </AlertDialogDescription>
          {children}
          {error && <Feedback error>{error}</Feedback>}
          <div className="ji-actions">
            <Button variant="outline" className="ji-secondary" disabled={pending} onClick={onClose}>
              {cancelLabel}
            </Button>
            <Button
              className={destructive ? "ji-danger" : "ji-primary"}
              disabled={pending}
              onClick={onConfirm}
            >
              {pending ? "Please wait…" : confirmLabel}
            </Button>
          </div>
        </AlertDialogPopup>
      </AlertDialogPortal>
    </AlertDialog>
  );
}
