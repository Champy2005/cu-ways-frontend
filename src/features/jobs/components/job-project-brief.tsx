"use client";

import { ChevronRight, Link2, PencilLine, Plus } from "lucide-react";
import {
  startTransition,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";

import { Button } from "@/components/ui/button";
import { BriefAttachmentHistorySheet } from "@/features/jobs/components/brief-attachment-history-sheet";
import { ProjectBriefDialog } from "@/features/jobs/components/project-brief-dialog";
import { loadJobBriefs, saveJobBrief, type SaveJobBriefState } from "@/features/jobs/brief-actions";
import {
  cacheProjectBriefHistory,
  mergeProjectBriefMetadata,
  readProjectBriefHistory,
  type ProjectBriefAttachment,
  type ProjectBriefValues,
} from "@/features/jobs/project-brief";

type JobProjectBriefProps = {
  jobId: string;
  creatorId: number;
  creatorName?: string;
  onSaved?: () => void;
};

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

export function JobProjectBrief(props: JobProjectBriefProps) {
  return <ProjectBriefSection key={`${props.creatorId}:${props.jobId}`} {...props} />;
}

function ProjectBriefSection({ jobId, creatorId, creatorName, onSaved }: JobProjectBriefProps) {
  const id = useId();
  const [cachedMetadata] = useState(() => readProjectBriefHistory(jobId, creatorId));
  const metadata = useRef(cachedMetadata);
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "success"; history: ProjectBriefAttachment[] }
  >({ status: "loading" });
  const [saving, startSaving] = useTransition();
  const [saveFailure, setSaveFailure] = useState<Exclude<
    SaveJobBriefState,
    { status: "success" }
  > | null>(null);
  const [editing, setEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const addButton = useRef<HTMLButtonElement>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const historyButton = useRef<HTMLButtonElement>(null);
  const mounted = useRef(true);
  const request = useRef(0);
  const busy = useRef(false);
  const history = state.status === "success" ? state.history : [];
  const current = history[0];

  const reload = useCallback(async () => {
    const attempt = ++request.current;
    setState({ status: "loading" });
    try {
      const result = await loadJobBriefs(jobId);
      if (!mounted.current || attempt !== request.current) return false;
      if (result.status === "error") {
        setState(result);
        return false;
      }
      if (result.creatorId !== creatorId) throw new Error("Session changed");
      setState({
        status: "success",
        history: mergeProjectBriefMetadata(result.history, metadata.current),
      });
      return true;
    } catch {
      if (mounted.current && attempt === request.current) {
        setState({
          status: "error",
          message: "Your project brief could not be loaded. Reload briefs to try again.",
        });
      }
      return false;
    }
  }, [jobId, creatorId]);

  useEffect(() => {
    mounted.current = true;
    startTransition(() => {
      void reload();
    });
    return () => {
      mounted.current = false;
    };
  }, [reload]);

  function saveBrief(values: ProjectBriefValues) {
    if (busy.current || saveFailure?.status === "reconcile") return;
    busy.current = true;
    setSaveFailure(null);
    startSaving(async () => {
      try {
        const result = await saveJobBrief(jobId, values.url);
        if (!mounted.current) return;
        if (result.status !== "success") {
          setSaveFailure(result);
          if (result.status === "reconcile") setState({ status: "error", message: result.message });
          return;
        }
        if (result.creatorId !== creatorId) throw new Error("Session changed");
        const attachment: ProjectBriefAttachment = {
          id: String(result.brief.attachment_id),
          url: result.brief.url,
          updatedAt: result.brief.upload_at,
          title: values.title,
          updatedBy: { creatorId, name: creatorName?.trim() || "Unknown user" },
        };
        metadata.current = [
          attachment,
          ...metadata.current.filter((entry) => entry.id !== attachment.id),
        ];
        cacheProjectBriefHistory(jobId, creatorId, metadata.current);
        // The POST response is persisted already; update this view without refetching the page/history.
        setState((previous) => ({
          status: "success",
          history: [
            attachment,
            ...(previous.status === "success" ? previous.history : []).filter(
              (entry) => entry.id !== attachment.id,
            ),
          ],
        }));
        setEditing(false);
        onSaved?.();
      } catch {
        if (mounted.current) {
          setSaveFailure({
            status: "reconcile",
            message: "The save could not be confirmed. Reload brief history before saving again.",
          });
          setState({ status: "error", message: "Reload brief history before saving again." });
        }
      } finally {
        busy.current = false;
      }
    });
  }

  function reloadHistory() {
    startTransition(async () => {
      if (await reload()) {
        setEditing(false);
        setSaveFailure(null);
      }
    });
  }

  return (
    <section
      aria-labelledby={`${id}-heading`}
      aria-busy={state.status === "loading"}
      className="border-t border-[var(--mk-border)] pt-5 text-[var(--mk-text)]"
    >
      <h2 id={`${id}-heading`} className="text-base leading-5 font-bold">
        Project Brief
      </h2>
      <p className="mt-0.5 text-xs leading-4 text-[var(--mk-muted)]">
        Attach a reference document for this job
      </p>

      {state.status !== "success" ? (
        <div className="mt-3 rounded-xl border border-[var(--mk-border)] bg-[var(--mk-field)] p-4">
          {state.status === "loading" ? (
            <p aria-live="polite" className="text-sm text-[var(--mk-muted)]">
              Loading project brief…
            </p>
          ) : (
            <>
              <p role="alert" className="text-sm text-[var(--mk-muted)]">
                {state.message}
              </p>
              <Button type="button" variant="outline" className="mt-3" onClick={reloadHistory}>
                Reload briefs
              </Button>
            </>
          )}
        </div>
      ) : current ? (
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
              disabled={saving}
              onClick={() => {
                setSaveFailure(null);
                setEditing(true);
              }}
              className="shrink-0 text-[var(--mk-text)]"
            >
              <PencilLine aria-hidden="true" className="size-4" />
            </Button>
          </div>
          <Button
            ref={historyButton}
            type="button"
            variant="ghost"
            aria-haspopup="dialog"
            aria-expanded={showHistory}
            aria-controls={`${id}-history`}
            onClick={() => setShowHistory(true)}
            className="mt-1.5 h-8 gap-0 px-1 text-xs font-medium text-[var(--mk-accent)] hover:text-[var(--mk-accent)]"
          >
            View attachment history ({history.length})
            <ChevronRight aria-hidden="true" className="size-3.5" />
          </Button>
        </>
      ) : (
        <div className="mt-3 flex flex-col items-center rounded-xl border-2 border-dashed border-[var(--mk-border)] bg-[var(--mk-field)] px-4 py-4 text-center">
          <Link2 aria-hidden="true" className="size-6 -rotate-45 text-[var(--mk-muted)]" />
          <p className="mt-2 text-sm text-[var(--mk-muted)]">No project brief attached yet</p>
          <Button
            ref={addButton}
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => {
              setSaveFailure(null);
              setEditing(true);
            }}
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
          pending={saving}
          error={saveFailure?.message}
          reconcile={saveFailure?.status === "reconcile"}
          onReload={reloadHistory}
          finalFocus={() => editButton.current ?? addButton.current}
        />
      )}

      <BriefAttachmentHistorySheet
        open={showHistory && state.status === "success"}
        id={`${id}-history`}
        history={history}
        creatorId={creatorId}
        creatorName={creatorName}
        onClose={() => setShowHistory(false)}
        finalFocus={() => historyButton.current}
      />
    </section>
  );
}
