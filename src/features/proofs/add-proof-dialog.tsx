"use client";

import { X } from "lucide-react";
import { useId, useRef, type ReactNode, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogOverlay,
  DialogPopup,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function AddProofDialog({
  open,
  saving,
  draft,
  fieldError,
  inputRef,
  notice,
  onDraftChange,
  onSubmit,
  onClose,
  finalFocus,
}: {
  open: boolean;
  saving: boolean;
  draft: string;
  fieldError: string;
  inputRef: RefObject<HTMLInputElement | null>;
  notice?: ReactNode;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  finalFocus: () => HTMLElement | null;
}) {
  const container = useRef<HTMLDivElement>(null);
  const errorId = useId();
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <div ref={container} />
      <DialogPortal container={container}>
        <DialogOverlay className="mk-dialog-backdrop fixed inset-0 z-[60] data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <DialogPopup
          initialFocus={inputRef}
          finalFocus={finalFocus}
          aria-busy={saving}
          className="mk-dialog-surface fixed inset-x-0 bottom-0 z-[70] rounded-t-[20px] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] outline-none sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:w-[calc(100%-2rem)] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[20px]"
        >
          <div className="flex items-start justify-between gap-3">
            <DialogTitle className="text-lg leading-7 font-semibold text-[var(--mk-text)]">
              {saving ? "Saving proof" : "Add proof"}
            </DialogTitle>
            <DialogClose
              aria-label={saving ? "Continue browsing" : "Close"}
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-[var(--mk-muted)]"
                />
              }
            >
              <X aria-hidden="true" className="size-5" />
            </DialogClose>
          </div>
          <DialogDescription className="mt-1 text-sm text-[var(--mk-muted)]">
            Share a link to your delivery evidence, such as screenshots or distribution metrics.
          </DialogDescription>
          {notice && <div className="mt-4">{notice}</div>}
          <form
            noValidate
            className="mt-5 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
          >
            <label className="block min-w-0 space-y-1">
              <span className="font-medium">Delivery link</span>
              <Input
                ref={inputRef}
                name="url"
                type="url"
                inputMode="url"
                autoComplete="url"
                placeholder="https://"
                value={draft}
                readOnly={saving}
                aria-invalid={fieldError ? true : undefined}
                aria-describedby={fieldError ? errorId : undefined}
                onChange={(event) => onDraftChange(event.target.value)}
              />
            </label>
            {fieldError && (
              <p id={errorId} className="text-sm text-[var(--mk-error)]">
                {fieldError}
              </p>
            )}
            <div className="flex justify-end max-[30rem]:grid">
              <Button
                type="submit"
                className="mk-primary-button"
                disabled={saving || !draft.trim()}
                aria-busy={saving}
              >
                {saving ? "Saving proof…" : "Save proof"}
              </Button>
            </div>
          </form>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
