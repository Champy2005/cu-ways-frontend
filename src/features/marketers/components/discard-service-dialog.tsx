import {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";
import type { RefObject } from "react";

import { Button } from "@/components/ui/button";

export function DiscardServiceDialog({
  open,
  onKeepEditing,
  onDiscard,
  portalContainer,
}: {
  open: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
  portalContainer: RefObject<HTMLDivElement | null>;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onKeepEditing()}>
      <AlertDialogPortal container={portalContainer}>
        <AlertDialogOverlay className="mk-dialog-backdrop fixed inset-0 z-[80]" />
        <AlertDialogPopup className="mk-dialog-surface fixed top-1/2 left-1/2 z-[90] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl p-6 outline-none">
          <AlertDialogTitle className="text-lg font-semibold">
            Discard your changes?
          </AlertDialogTitle>
          <AlertDialogDescription className="mt-2 text-sm leading-6 text-[var(--mk-muted)]">
            Your unsaved service details will be lost.
          </AlertDialogDescription>
          <div className="mt-6 flex flex-wrap gap-3">
            <AlertDialogClose
              render={<Button variant="outline" className="mk-secondary-button flex-1" />}
            >
              Keep editing
            </AlertDialogClose>
            <Button
              onClick={onDiscard}
              className="h-11 flex-1 bg-[#b91c1c] text-white hover:bg-[#991b1b]"
            >
              Discard
            </Button>
          </div>
        </AlertDialogPopup>
      </AlertDialogPortal>
    </AlertDialog>
  );
}
