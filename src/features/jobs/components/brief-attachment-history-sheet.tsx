"use client";

import { ExternalLink, X } from "lucide-react";
import { useRef } from "react";

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
import { projectBriefEditorName, type ProjectBriefAttachment } from "@/features/jobs/project-brief";
import { cn } from "@/lib/utils";

function attachmentSource(value: string): string {
  const url = new URL(value);
  if (["docs.google.com", "drive.google.com"].includes(url.hostname)) return "Google Drive";
  if (/(^|\.)notion\.(so|site)$/.test(url.hostname)) return "Notion";
  if (url.pathname.toLowerCase().endsWith(".pdf")) return "PDF document";
  return url.hostname.replace(/^www\./, "");
}

function AttachmentHistoryCard({
  attachment,
  current,
  original,
  creatorId,
  creatorName,
}: {
  attachment: ProjectBriefAttachment;
  current: boolean;
  original: boolean;
  creatorId: number;
  creatorName?: string;
}) {
  const title = attachment.title || "Project brief";
  const editor = projectBriefEditorName(attachment, creatorId, creatorName);
  return (
    <article
      aria-label={`${title}, ${current ? "Current" : "Replaced"}`}
      className={cn(
        "min-w-0 rounded-xl bg-[var(--mk-field)] px-3 py-2.5",
        current ? "border-2 border-[var(--mk-success)]" : "border border-[var(--mk-border)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3
          className={cn(
            "min-w-0 truncate text-[13px] leading-5 font-bold",
            current ? "text-[var(--mk-text)]" : "text-[var(--mk-muted)]",
          )}
        >
          {title}
        </h3>
        <span
          className={cn(
            "shrink-0 pt-0.5 text-[9px] leading-4 font-semibold",
            current ? "text-[var(--mk-success)]" : "text-[var(--mk-muted)]",
          )}
        >
          {current ? "Current" : "Replaced"}
        </span>
      </div>
      <p
        title={attachment.url}
        className={cn(
          "mt-1 truncate text-[11px] leading-4",
          current ? "text-[var(--mk-secondary)]" : "text-[var(--mk-muted)]",
        )}
      >
        {attachment.url}
      </p>
      <p className="text-[11px] leading-4 text-[var(--mk-muted)]">
        <time dateTime={attachment.updatedAt}>
          {new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
          }).format(new Date(attachment.updatedAt))}
        </time>
        {" · "}
        {original ? "Created" : "Updated"} by {editor}
      </p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-[11px] text-[var(--mk-muted)]">
          {attachmentSource(attachment.url)}
        </span>
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${title} in a new tab`}
          className={cn(
            "inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-[var(--mk-hover)] hover:bg-[var(--mk-border)]",
            current ? "text-[var(--mk-text)]" : "text-[var(--mk-muted)]",
          )}
        >
          <ExternalLink aria-hidden="true" className="size-3.5" />
        </a>
      </div>
    </article>
  );
}

export function BriefAttachmentHistorySheet({
  open,
  id,
  history,
  creatorId,
  creatorName,
  onClose,
  finalFocus,
}: {
  open: boolean;
  id: string;
  history: readonly ProjectBriefAttachment[];
  creatorId: number;
  creatorName?: string;
  onClose: () => void;
  finalFocus: () => HTMLElement | null;
}) {
  const container = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <div ref={container} />
      <DialogPortal container={container}>
        <DialogOverlay className="fixed inset-0 z-[60] bg-black/25 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <DialogPopup
          id={id}
          initialFocus={closeButton}
          finalFocus={finalFocus}
          className="mk-dialog-surface fixed inset-x-0 bottom-0 z-[70] flex h-[84dvh] max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-t-[20px] outline-none transition-transform! duration-300! data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full motion-reduce:transition-none! sm:right-auto sm:left-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--mk-border)] px-5 py-4">
            <DialogTitle className="text-base leading-6 font-bold text-[var(--mk-text)]">
              Brief Attachment History
            </DialogTitle>
            <DialogClose
              ref={closeButton}
              aria-label="Close attachment history"
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
          <DialogDescription className="sr-only">
            Review versions of this job&apos;s project brief. The current attachment is listed
            first.
          </DialogDescription>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <ol aria-label="Attachment history" className="space-y-5">
              {history.map((attachment, index) => (
                <li key={attachment.id} className="relative pl-6">
                  {index < history.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute top-3 -bottom-5 left-[5px] w-px bg-[var(--mk-border)]"
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute top-0 left-0 size-2.5 rounded-full",
                      index === 0 ? "bg-[var(--mk-success)]" : "bg-[var(--mk-muted)]",
                    )}
                  />
                  <AttachmentHistoryCard
                    attachment={attachment}
                    current={index === 0}
                    original={index === history.length - 1}
                    creatorId={creatorId}
                    creatorName={creatorName}
                  />
                </li>
              ))}
            </ol>
          </div>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
