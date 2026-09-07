"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
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
    <AlertDialog.Root open onOpenChange={(open) => !open && !inFlight.current && onClose()}>
      <div ref={portalContainer} />
      <AlertDialog.Portal container={portalContainer}>
        <AlertDialog.Backdrop className="mk-dialog-backdrop fixed inset-0 z-[60]" />
        <AlertDialog.Popup
          finalFocus={finalFocus}
          className="mk-dialog-surface fixed top-1/2 left-1/2 z-[70] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl p-6 outline-none sm:p-8"
        >
          <AlertDialog.Title className="text-xl font-semibold">Delete service?</AlertDialog.Title>
          <AlertDialog.Description className="mt-3 text-sm leading-6 break-words text-[var(--mk-muted)]">
            <strong className="font-semibold text-[var(--mk-text)]">{service.service_type}</strong>{" "}
            will be removed from your published catalog. This cannot be undone.
          </AlertDialog.Description>
          {error && (
            <p role="alert" className="mk-error-notice mt-4 rounded-xl p-3 text-sm">
              {error}
            </p>
          )}
          <div className="mt-7 flex gap-3">
            <AlertDialog.Close
              disabled={pending}
              render={<Button variant="outline" className="mk-secondary-button flex-1" />}
            >
              Cancel
            </AlertDialog.Close>
            <Button
              onClick={remove}
              disabled={pending}
              className="h-11 flex-1 bg-[#b91c1c] text-white hover:bg-[#991b1b]"
            >
              {pending ? "Deleting…" : "Delete service"}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
