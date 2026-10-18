"use client";

import { Link2, X } from "lucide-react";
import { useId, useRef, useState, type FormEvent } from "react";

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
import { parseProjectBriefUrl, type ProjectBriefValues } from "@/features/jobs/project-brief";

export function ProjectBriefDialog({
  initialValues,
  onSave,
  onClose,
  finalFocus,
}: {
  initialValues?: ProjectBriefValues;
  onSave: (values: ProjectBriefValues) => void;
  onClose: () => void;
  finalFocus: () => HTMLElement | null;
}) {
  const id = useId();
  const container = useRef<HTMLDivElement>(null);
  const urlInput = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialValues?.url ?? "");
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [urlTouched, setUrlTouched] = useState(false);
  const validUrl = parseProjectBriefUrl(url);
  const changed = validUrl !== initialValues?.url || title.trim() !== initialValues?.title;
  const urlError = urlTouched && !validUrl;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validUrl) {
      setUrlTouched(true);
      urlInput.current?.focus();
      return;
    }
    if (changed) onSave({ url: validUrl, title: title.trim() });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <div ref={container} />
      <DialogPortal container={container}>
        <DialogOverlay className="fixed inset-0 z-[60] bg-black/45" />
        <DialogPopup
          initialFocus={urlInput}
          finalFocus={finalFocus}
          className="mk-dialog-surface fixed top-1/2 left-1/2 z-[70] flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2.5rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[14px] outline-none"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--mk-border)] px-5 py-3.5">
            <DialogTitle className="text-base leading-6 font-bold text-[var(--mk-text)]">
              Project Brief URL
            </DialogTitle>
            <DialogClose
              aria-label="Close project brief dialog"
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="rounded-full bg-[var(--mk-field)] text-[var(--mk-muted)]"
                />
              }
            >
              <X aria-hidden="true" className="size-3.5" />
            </DialogClose>
          </div>
          <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 space-y-4 overflow-y-auto p-5">
              <DialogDescription className="text-[11px] leading-4 text-[var(--mk-muted)]">
                Provide a viewable link to instructions, guidelines, or reference materials (e.g.
                Google Drive, Notion, PDF link).
              </DialogDescription>
              <div className="space-y-1.5">
                <label
                  htmlFor={`${id}-url`}
                  className="block text-xs font-semibold text-[var(--mk-muted)]"
                >
                  Brief URL <span aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <Link2
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 -rotate-45 text-[var(--mk-muted)]"
                  />
                  <Input
                    ref={urlInput}
                    id={`${id}-url`}
                    type="url"
                    name="brief-url"
                    required
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    onBlur={() => setUrlTouched(true)}
                    aria-invalid={urlError}
                    aria-describedby={urlError ? `${id}-url-error` : undefined}
                    placeholder="https://docs.google.com/..."
                    className="h-[42px] rounded-xl border-[var(--mk-border)] bg-[var(--mk-surface)] pr-3 pl-8 text-sm text-[var(--mk-text)] placeholder:text-[var(--mk-muted)] focus-visible:border-[var(--mk-accent)] focus-visible:ring-2 focus-visible:ring-[var(--mk-accent-soft)] focus-visible:outline-none! md:text-sm"
                  />
                </div>
                {urlError && (
                  <p id={`${id}-url-error`} role="alert" className="text-xs text-destructive">
                    Enter a valid URL starting with http:// or https://.
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor={`${id}-title`}
                  className="block text-xs font-semibold text-[var(--mk-muted)]"
                >
                  Brief Title / Note
                </label>
                <Input
                  id={`${id}-title`}
                  name="brief-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Campaign Guidelines v2 (Optional)"
                  className="h-[42px] rounded-xl border-[var(--mk-border)] bg-[var(--mk-surface)] px-3 text-sm text-[var(--mk-text)] placeholder:text-[var(--mk-muted)] focus-visible:border-[var(--mk-accent)] focus-visible:ring-2 focus-visible:ring-[var(--mk-accent-soft)] focus-visible:outline-none! md:text-sm"
                />
              </div>
            </div>
            <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-[var(--mk-border)] bg-[var(--mk-field)] p-3.5">
              <DialogClose
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-[42px] rounded-xl bg-[var(--mk-hover)] text-sm font-bold text-[var(--mk-text)] hover:bg-[var(--mk-border)]"
                  />
                }
              >
                Cancel
              </DialogClose>
              <Button
                type="submit"
                disabled={!validUrl || !changed}
                className="h-[42px] rounded-xl bg-[var(--mk-action)] text-sm font-bold text-white hover:bg-[var(--mk-action-hover)] disabled:bg-[var(--mk-border)] disabled:text-[var(--mk-muted)] disabled:opacity-60"
              >
                Save Brief
              </Button>
            </div>
          </form>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
