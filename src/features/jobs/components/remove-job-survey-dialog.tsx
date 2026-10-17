"use client";

import Image from "next/image";
import { useRef } from "react";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPopup,
  AlertDialogPortal,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RemoveJobSurveyDialog({
  surveyTitle,
  isLastSurvey,
  onClose,
  onConfirm,
  onAddAnother,
  finalFocus,
}: {
  surveyTitle: string;
  isLastSurvey: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onAddAnother: () => void;
  finalFocus: () => HTMLElement | null;
}) {
  const portalContainer = useRef<HTMLDivElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <div ref={portalContainer} />
      <AlertDialogPortal container={portalContainer}>
        <AlertDialogOverlay className="fixed inset-0 z-[60] bg-[#0d111a]/70 supports-backdrop-filter:backdrop-blur-none" />
        <AlertDialogPopup
          initialFocus={cancelButton}
          finalFocus={finalFocus}
          className="mk-dialog-surface fixed top-1/2 left-1/2 z-[70] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[312px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[18px] p-5 text-center outline-none"
        >
          <AlertDialogTitle className="text-lg leading-6 font-bold">
            {isLastSurvey ? "Keep at least one survey" : "Remove this survey?"}
          </AlertDialogTitle>
          {!isLastSurvey && (
            <div
              aria-hidden="true"
              className="relative mx-auto mt-2 h-28 w-24 text-[var(--mk-text)]"
            >
              <Image
                src="/marketer-assets/mascot-pink.svg"
                alt=""
                width={64}
                height={61}
                className="absolute top-2.5 left-2 h-[61px] w-16 -scale-x-100"
              />
              <svg
                className="absolute inset-0 size-full"
                viewBox="0 0 96 112"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="square"
                strokeLinejoin="round"
              >
                <path d="m50 6 37 22m-23-22 10 6M27 64v41q0 3 3 3h33q3 0 3-3V64M40 69v27m13-27v27" />
              </svg>
            </div>
          )}
          <AlertDialogDescription
            className={cn(
              "text-[13px] leading-[18px] wrap-break-word text-[var(--mk-muted)]",
              isLastSurvey ? "mt-1" : "mt-4",
            )}
          >
            {isLastSurvey
              ? "This is the last linked survey. Every job must have at least one survey, so it cannot be removed until another survey is linked."
              : `${surveyTitle} will no longer be available to marketers in this job. The survey itself will not be deleted.`}
          </AlertDialogDescription>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <AlertDialogClose
              ref={cancelButton}
              render={
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 rounded-[14px] border border-[var(--mk-border)] bg-[var(--mk-surface)] text-sm font-bold text-[var(--mk-text)] shadow-card hover:bg-[var(--mk-hover)]"
                />
              }
            >
              Cancel
            </AlertDialogClose>
            <Button
              type="button"
              onClick={isLastSurvey ? onAddAnother : onConfirm}
              className={cn(
                "h-11 rounded-[14px] text-sm font-bold text-white shadow-card",
                isLastSurvey
                  ? "bg-[var(--mk-action)] hover:bg-[var(--mk-action-hover)]"
                  : "bg-[#f53338] hover:bg-[#df252b]",
              )}
            >
              {isLastSurvey ? "Add another" : "Remove"}
            </Button>
          </div>
        </AlertDialogPopup>
      </AlertDialogPortal>
    </AlertDialog>
  );
}
