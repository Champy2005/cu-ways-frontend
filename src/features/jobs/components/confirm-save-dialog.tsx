"use client";

import { useRef, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPopup,
  AlertDialogPortal,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import "../offers.css";

/**
 * Confirmation before saving a job record. Closing is always allowed, even
 * mid-save: the request keeps running and the page shows its result, so the
 * Creator is never trapped. Only a second confirm is blocked while saving.
 */
export function ConfirmSaveDialog({
  title,
  description,
  children,
  savingNote,
  confirmLabel,
  pendingLabel,
  pending,
  error,
  onConfirm,
  onClose,
  finalFocus,
}: {
  title: string;
  description: string;
  children: ReactNode;
  savingNote: string;
  confirmLabel: string;
  pendingLabel: string;
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
  finalFocus: () => HTMLElement | null;
}) {
  const container = useRef<HTMLDivElement>(null);
  const goBack = useRef<HTMLButtonElement>(null);
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <div ref={container} />
      <AlertDialogPortal container={container}>
        <AlertDialogOverlay className="mk-dialog-backdrop fixed inset-0 z-[60]" />
        <AlertDialogPopup
          className="jo-modal jo-confirm mk-dialog-surface"
          finalFocus={finalFocus}
          initialFocus={goBack}
        >
          <AlertDialogTitle className="jo-modal-title">{title}</AlertDialogTitle>
          <AlertDialogDescription className="jo-muted">{description}</AlertDialogDescription>
          <div className="jo-confirm-summary">{children}</div>
          {pending && (
            <p role="status" className="jo-muted">
              {savingNote} You can close this window; it keeps saving and the page shows the result.
              Closing does not cancel it.
            </p>
          )}
          {error && (
            <p role="alert" className="mk-error-notice rounded-lg p-3 text-sm">
              {error}
            </p>
          )}
          <div className="jo-card-actions">
            <Button ref={goBack} variant="outline" className="jo-secondary" onClick={onClose}>
              {pending ? "Close" : "Go back"}
            </Button>
            <Button className="jo-primary" disabled={pending} onClick={onConfirm}>
              {pending ? pendingLabel : error ? "Try again" : confirmLabel}
            </Button>
          </div>
        </AlertDialogPopup>
      </AlertDialogPortal>
    </AlertDialog>
  );
}
