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
import type { SavedOffer } from "./types";
import { formatPrice } from "../format";

export type WithdrawOfferModalProps = {
  isOpen: boolean;
  offer: SavedOffer;
  jobTitle: string;
  pending: boolean;
  confirmDisabled?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
  finalFocus?: () => HTMLElement | null;
};

export function WithdrawOfferModal({
  isOpen,
  offer,
  jobTitle,
  pending,
  confirmDisabled = false,
  error,
  onClose,
  onConfirm,
  finalFocus,
}: WithdrawOfferModalProps) {
  const container = useRef<HTMLDivElement>(null);
  const keepButton = useRef<HTMLButtonElement>(null);
  if (!isOpen) return null;
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
          initialFocus={keepButton}
          finalFocus={finalFocus}
          className="mk-dialog-surface fixed top-1/2 left-1/2 z-[61] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--mk-border)] p-6 text-[var(--mk-text)] shadow-2xl outline-none"
        >
          <AlertDialogTitle className="text-center text-lg font-bold">
            Withdraw this offer?
          </AlertDialogTitle>
          <div className="my-4 space-y-2 rounded-xl border border-[var(--mk-border)] bg-[var(--mk-field)] p-3.5">
            <p className="text-sm font-semibold wrap-anywhere">{jobTitle}</p>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-[var(--mk-muted)]">Offered price</span>
              <span className="font-semibold">{formatPrice(offer.offered_price)}</span>
            </div>
          </div>
          <AlertDialogDescription className="text-center text-xs leading-relaxed text-[var(--mk-muted)]">
            The creator will no longer be able to accept it. Your offer stays in your history, and
            you can send a new one if this job is still open.
          </AlertDialogDescription>
          {error && (
            <p
              role="alert"
              className="mt-3 rounded-lg border border-[var(--mk-error)] p-2.5 text-center text-xs text-[var(--mk-error)]"
            >
              {error}
            </p>
          )}
          <div className="mt-6 flex items-center gap-3">
            <Button
              ref={keepButton}
              type="button"
              variant="outline"
              disabled={pending}
              onClick={onClose}
              className="flex-1"
            >
              Keep offer
            </Button>
            <Button
              type="button"
              disabled={pending || confirmDisabled}
              onClick={onConfirm}
              className="flex-1 bg-[#b42318] text-white hover:bg-[#912018]"
            >
              {pending ? "Withdrawing…" : "Withdraw"}
            </Button>
          </div>
        </AlertDialogPopup>
      </AlertDialogPortal>
    </AlertDialog>
  );
}
