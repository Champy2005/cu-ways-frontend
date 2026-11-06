"use client";

import { useRef } from "react";
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPopup,
  AlertDialogPortal,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { formatSatang, type PaymentMethod } from "../payment";

export function PaymentConfirmDialog({
  marketerName,
  method,
  amountSatang,
  pending,
  error,
  onConfirm,
  onClose,
  finalFocus,
}: {
  marketerName: string;
  method: PaymentMethod;
  amountSatang: number;
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
        // Escape and outside clicks are ignored while the save is settling.
        if (!open && !pending) onClose();
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
          <AlertDialogTitle className="jo-modal-title">Record this payment?</AlertDialogTitle>
          <AlertDialogDescription className="jo-muted">
            The payment will be saved as Paid for this job. Check the details before you confirm; a
            recorded payment cannot be edited here.
          </AlertDialogDescription>
          <div className="jo-confirm-summary">
            <dl className="pay-details">
              <div>
                <dt>Marketer</dt>
                <dd>{marketerName}</dd>
              </div>
              <div>
                <dt>Method</dt>
                <dd>{method}</dd>
              </div>
              <div>
                <dt>Amount</dt>
                <dd>{formatSatang(amountSatang)}</dd>
              </div>
            </dl>
          </div>
          <p className="jo-muted">This records a payment only. No money is collected or moved.</p>
          {error && (
            <p role="alert" className="mk-error-notice rounded-lg p-3 text-sm">
              {error}
            </p>
          )}
          <div className="jo-card-actions">
            <Button
              ref={goBack}
              variant="outline"
              className="jo-secondary"
              disabled={pending}
              onClick={onClose}
            >
              Go back
            </Button>
            <Button className="jo-primary" disabled={pending} onClick={onConfirm}>
              {pending ? "Recording…" : error ? "Try again" : "Confirm record"}
            </Button>
          </div>
        </AlertDialogPopup>
      </AlertDialogPortal>
    </AlertDialog>
  );
}
