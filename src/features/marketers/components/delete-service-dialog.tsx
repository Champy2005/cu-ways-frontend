"use client";

import {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { Service } from "@/features/marketers/types";
import { getDisplayError } from "@/lib/api/errors";

export function DeleteServiceDialog({
  service,
  onDelete,
  onDeleted,
  onClose,
  finalFocus,
}: {
  service: Service;
  onDelete: (id: number) => Promise<void>;
  onDeleted: () => void;
  onClose: () => void;
  finalFocus?: () => HTMLElement | null;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const portalContainer = useRef<HTMLDivElement>(null);

  async function remove() {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      await onDelete(service.service_id);
      onDeleted();
    } catch (caught) {
      setError(getDisplayError(caught));
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <AlertDialog open onOpenChange={(open) => !open && !inFlight.current && onClose()}>
      <div ref={portalContainer} />
      <AlertDialogPortal container={portalContainer}>
        <AlertDialogOverlay className="mk-dialog-backdrop fixed inset-0 z-[60]" />
        <AlertDialogPopup
          finalFocus={finalFocus}
          className="mk-dialog-surface fixed top-1/2 left-1/2 z-[70] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl p-6 outline-none sm:p-8"
        >
          <AlertDialogTitle className="text-xl font-semibold">Delete service?</AlertDialogTitle>
          <AlertDialogDescription className="mt-3 text-sm leading-6 break-words text-[var(--mk-muted)]">
            <strong className="font-semibold text-[var(--mk-text)]">{service.service_type}</strong>{" "}
            will be removed from your published catalog. This cannot be undone.
          </AlertDialogDescription>
          {error && (
            <p role="alert" className="mk-error-notice mt-4 rounded-xl p-3 text-sm">
              {error}
            </p>
          )}
          <div className="mt-7 flex gap-3">
            <AlertDialogClose
              disabled={pending}
              render={<Button variant="outline" className="mk-secondary-button flex-1" />}
            >
              Cancel
            </AlertDialogClose>
            <Button
              onClick={remove}
              disabled={pending}
              className="h-11 flex-1 bg-[#b91c1c] text-white hover:bg-[#991b1b]"
            >
              {pending ? "Deleting…" : "Delete service"}
            </Button>
          </div>
        </AlertDialogPopup>
      </AlertDialogPortal>
    </AlertDialog>
  );
}
