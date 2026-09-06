import { AlertDialog } from "@base-ui/react/alert-dialog";
import { useRef } from "react";

import { Button } from "@/components/ui/button";

export function DiscardServiceDialog({
  open,
  onKeepEditing,
  onDiscard,
}: {
  open: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
}) {
  const portalContainer = useRef<HTMLDivElement>(null);
  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => !next && onKeepEditing()}>
      <div ref={portalContainer} />
      <AlertDialog.Portal container={portalContainer} className="[color-scheme:light]">
        <AlertDialog.Backdrop className="fixed inset-0 z-[80] bg-[#0d111a]/55" />
        <AlertDialog.Popup className="fixed top-1/2 left-1/2 z-[90] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[#f9f9f9] p-6 text-[#0d111a] shadow-xl outline-none">
          <AlertDialog.Title className="text-lg font-semibold">
            Discard your changes?
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm leading-6 text-[#626976]">
            Your unsaved service details will be lost.
          </AlertDialog.Description>
          <div className="mt-6 flex flex-wrap gap-3">
            <AlertDialog.Close
              render={
                <Button
                  variant="outline"
                  className="h-11 flex-1 border-[#d8dadd] bg-white text-[#0d111a]"
                />
              }
            >
              Keep editing
            </AlertDialog.Close>
            <Button
              onClick={onDiscard}
              className="h-11 flex-1 bg-[#b91c1c] text-white hover:bg-[#991b1b]"
            >
              Discard
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
