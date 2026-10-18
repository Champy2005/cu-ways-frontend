"use client";

import { useRef } from "react";
import {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { formatOfferPrice } from "../format";
import { formatOfferDate } from "./job-offer-card";
import type { JobOfferComparison } from "../types";

export function AcceptOfferDialog({
  offer,
  pending,
  onConfirm,
  onClose,
  finalFocus,
}: {
  offer: JobOfferComparison;
  pending: boolean;
  onConfirm: () => void;
  onClose: () => void;
  finalFocus: () => HTMLElement | null;
}) {
  const container = useRef<HTMLDivElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
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
        <AlertDialogPopup
          className="jo-modal jo-confirm mk-dialog-surface"
          finalFocus={finalFocus}
          initialFocus={cancel}
        >
          <AlertDialogTitle className="jo-modal-title">Accept this offer?</AlertDialogTitle>
          <AlertDialogDescription className="jo-muted">
            You will hire {offer.marketer.name} for this job. All other pending offers will be
            rejected and active invitations to other marketers will be closed.
          </AlertDialogDescription>
          <div className="jo-confirm-summary">
            <strong>{offer.marketer.name}</strong>
            <dl className="jo-terms">
              <div>
                <dt>Agreed price</dt>
                <dd className="jo-price">{formatOfferPrice(offer.offered_price)}</dd>
              </div>
              <div>
                <dt>Delivery date</dt>
                <dd>{formatOfferDate(offer.delivery_date)}</dd>
              </div>
            </dl>
          </div>
          <p className="jo-muted">
            The job will become Accepted. The marketer will start the work separately.
          </p>
          <div className="jo-card-actions">
            <Button
              ref={cancel}
              variant="outline"
              className="jo-secondary"
              disabled={pending}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button className="jo-primary" disabled={pending} onClick={onConfirm}>
              {pending ? "Accepting…" : "Confirm and hire"}
            </Button>
          </div>
        </AlertDialogPopup>
      </AlertDialogPortal>
    </AlertDialog>
  );
}
