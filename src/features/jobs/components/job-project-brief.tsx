"use client";

import { ChevronRight, Link2, PencilLine, Plus } from "lucide-react";
import { useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ProjectBriefDialog } from "@/features/jobs/components/project-brief-dialog";
import {
  cacheProjectBriefHistory,
  readProjectBriefHistory,
  type ProjectBriefAttachment,
  type ProjectBriefValues,
} from "@/features/jobs/project-brief";
import { cn } from "@/lib/utils";

function BriefDetails({ attachment }: { attachment: ProjectBriefAttachment }) {
  return (
    <div className="min-w-0 flex-1">
      <h3 className="truncate text-sm leading-5 font-bold text-[var(--mk-text)]">
        {attachment.title || "Project brief"}
      </h3>
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        title={attachment.url}
        className="block truncate text-xs leading-4 text-[var(--mk-secondary)] underline underline-offset-2"
      >
        {attachment.url}
      </a>
      <p className="text-[10px] leading-4 text-[var(--mk-muted)]">
        Updated{" "}
        <time dateTime={attachment.updatedAt}>
          {new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }).format(new Date(attachment.updatedAt))}
        </time>
      </p>
    </div>
  );
}

export function JobProjectBrief(props: { jobId: string; creatorId: number }) {
  return <ProjectBriefSection key={`${props.creatorId}:${props.jobId}`} {...props} />;
}

function ProjectBriefSection({ jobId, creatorId }: { jobId: string; creatorId: number }) {
  const id = useId();
  const [history, setHistory] = useState(() => readProjectBriefHistory(jobId, creatorId));
  const [editing, setEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const addButton = useRef<HTMLButtonElement>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const current = history[0];

  function saveBrief(values: ProjectBriefValues) {
    const nextHistory = [
      { ...values, id: crypto.randomUUID(), updatedAt: new Date().toISOString() },
      ...history,
    ];
    setHistory(nextHistory);
    cacheProjectBriefHistory(jobId, creatorId, nextHistory);
    setEditing(false);
  }

  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="border-t border-[var(--mk-border)] pt-5 text-[var(--mk-text)]"
    >
      <h2 id={`${id}-heading`} className="text-base leading-5 font-bold">
        Project Brief
      </h2>
      <p className="mt-0.5 text-xs leading-4 text-[var(--mk-muted)]">
        Attach a reference document for this job
      </p>

      {current ? (
        <>
          <div className="mt-3 flex min-h-[78px] items-center gap-3 rounded-2xl border border-[var(--mk-text)] bg-[var(--mk-surface)] px-4 py-3 shadow-card">
            <Link2
              aria-hidden="true"
              className="size-6 shrink-0 -rotate-45 text-[var(--mk-accent)]"
            />
            <BriefDetails attachment={current} />
            <Button
              ref={editButton}
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Edit project brief"
              onClick={() => setEditing(true)}
              className="shrink-0 text-[var(--mk-text)]"
            >
              <PencilLine aria-hidden="true" className="size-4" />
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            aria-expanded={showHistory}
            aria-controls={`${id}-history`}
            onClick={() => setShowHistory((shown) => !shown)}
            className="mt-1.5 h-8 gap-0 px-1 text-xs font-medium text-[var(--mk-accent)] hover:text-[var(--mk-accent)]"
          >
            View attachment history ({history.length})
            <ChevronRight
              aria-hidden="true"
              className={cn("size-3.5 transition-transform", showHistory && "rotate-90")}
            />
          </Button>
          {showHistory && (
            <ol id={`${id}-history`} aria-label="Attachment history" className="mt-2 space-y-2">
              {history.map((attachment, index) => (
                <li
                  key={attachment.id}
                  className="rounded-xl border border-[var(--mk-border)] bg-[var(--mk-surface)] px-3 py-2.5"
                >
                  <p className="mb-1 text-[10px] font-semibold text-[var(--mk-muted)]">
                    {index === 0 ? "Current brief" : "Previous brief"}
                  </p>
                  <BriefDetails attachment={attachment} />
                </li>
              ))}
            </ol>
          )}
        </>
      ) : (
        <div className="mt-3 flex flex-col items-center rounded-xl border-2 border-dashed border-[var(--mk-border)] bg-[var(--mk-field)] px-4 py-4 text-center">
          <Link2 aria-hidden="true" className="size-6 -rotate-45 text-[var(--mk-muted)]" />
          <p className="mt-2 text-sm text-[var(--mk-muted)]">No project brief attached yet</p>
          <Button
            ref={addButton}
            type="button"
            variant="outline"
            onClick={() => setEditing(true)}
            className="mt-3 h-8 gap-0.5 rounded-xl border-[var(--mk-accent)] bg-[var(--mk-accent-soft)] px-3 text-xs font-semibold text-[var(--mk-accent)] hover:bg-[var(--mk-accent-soft)] hover:text-[var(--mk-accent)]"
          >
            <Plus aria-hidden="true" className="size-3" />
            Add Brief URL
          </Button>
        </div>
      )}

      {editing && (
        <ProjectBriefDialog
          initialValues={current}
          onSave={saveBrief}
          onClose={() => setEditing(false)}
          finalFocus={() => editButton.current ?? addButton.current}
        />
      )}
    </section>
  );
}
