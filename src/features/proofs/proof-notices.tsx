import { RefreshCw } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProofError } from "./errors";

export type ProofOutcome =
  | { kind: "saved" }
  /** The server gave a definitive answer that the proof was not saved. */
  | { kind: "rejected"; error: ProofError }
  /** The save may or may not have happened; read the list before retrying. */
  | { kind: "unknown" }
  /** The saved list is being re-read for this URL. */
  | { kind: "checking"; url: string }
  | { kind: "not-saved" };

const tones = {
  success: "border-[var(--mk-success)]",
  error: "border-[var(--mk-error)]",
  warning: "border-[var(--mk-caution)]",
  info: "border-[var(--mk-info)]",
} as const;

export function Notice({
  tone,
  title,
  children,
  action,
}: {
  tone: keyof typeof tones;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      role={tone === "error" || tone === "warning" ? "alert" : "status"}
      className={cn(
        "space-y-2 rounded-xl border-l-4 bg-[var(--mk-field)] px-4 py-3 text-[var(--mk-text)]",
        tones[tone],
      )}
    >
      <p className="font-semibold">{title}</p>
      {children && <p className="text-sm text-[var(--mk-muted)]">{children}</p>}
      {action}
    </div>
  );
}

function NoticeAction({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Button variant="outline" className="mk-secondary-button" disabled={disabled} onClick={onClick}>
      {children}
    </Button>
  );
}

function RejectedNotice({
  error,
  busy,
  onReopen,
  onRefreshJob,
}: {
  error: ProofError;
  busy: boolean;
  onReopen: () => void;
  onRefreshJob: () => void;
}) {
  const action = {
    field: <NoticeAction onClick={onReopen}>Reopen proof form</NoticeAction>,
    rejected: <NoticeAction onClick={onReopen}>Reopen proof form</NoticeAction>,
    "job-changed": (
      <NoticeAction onClick={onRefreshJob} disabled={busy}>
        <RefreshCw aria-hidden="true" className="size-4" />
        Refresh job
      </NoticeAction>
    ),
    access: undefined,
    session: (
      <Link href="/login" className="inline-flex min-h-11 items-center font-medium underline">
        Sign in
      </Link>
    ),
  }[error.kind];
  return (
    <Notice
      tone={error.kind === "job-changed" ? "warning" : "error"}
      title={error.title}
      action={action}
    >
      {error.body}
    </Notice>
  );
}

/** Feedback shown in the saved-proof workspace after a save attempt. */
export function OutcomeNotice({
  outcome,
  busy,
  onReopen,
  onCheck,
  onRefreshJob,
}: {
  outcome: ProofOutcome | null;
  busy: boolean;
  onReopen: () => void;
  onCheck: () => void;
  onRefreshJob: () => void;
}) {
  switch (outcome?.kind) {
    case "saved":
      return <Notice tone="success" title="Proof saved" />;
    case "rejected":
      return (
        <RejectedNotice
          error={outcome.error}
          busy={busy}
          onReopen={onReopen}
          onRefreshJob={onRefreshJob}
        />
      );
    case "unknown":
      return (
        <Notice
          tone="warning"
          title="We couldn’t confirm the save"
          action={
            <NoticeAction onClick={onCheck} disabled={busy}>
              <RefreshCw aria-hidden="true" className="size-4" />
              Check saved proof
            </NoticeAction>
          }
        >
          Check the saved list before trying again.
        </Notice>
      );
    case "checking":
      return (
        <p role="status" className="text-sm text-[var(--mk-muted)]">
          Checking saved proof…
        </p>
      );
    case "not-saved":
      return (
        <Notice
          tone="info"
          title="This link wasn’t saved"
          action={<NoticeAction onClick={onReopen}>Try again</NoticeAction>}
        >
          You can try saving it again.
        </Notice>
      );
    default:
      return null;
  }
}

/** Compact version shown inside the Add proof dialog when it is reopened for recovery. */
export function DialogNotice({ outcome }: { outcome: ProofOutcome | null }) {
  if (outcome?.kind === "rejected")
    return (
      <Notice tone="error" title={outcome.error.title}>
        {outcome.error.body}
      </Notice>
    );
  if (outcome?.kind === "not-saved") return <Notice tone="info" title="Link not saved" />;
  return null;
}
