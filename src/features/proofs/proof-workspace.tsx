"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { parseProjectBriefUrl } from "@/features/jobs/project-brief";
import type { Proof } from "@/features/transactions/types";
import { saveProof, type SaveProofResult } from "./actions";
import { AddProofDialog } from "./add-proof-dialog";
import { describeProofError } from "./errors";
import { DialogNotice, OutcomeNotice, type ProofOutcome } from "./proof-notices";
import { ProofRecordList } from "./proof-list";

export const proofMessages = {
  empty: "Enter a delivery link.",
  invalid: "Enter a full link that starts with http:// or https://.",
} as const;

/** A03: after this long without an answer the save is treated as unconfirmed. */
export const proofSaveDeadlineMs = 12_000;

function withDeadline(request: Promise<SaveProofResult>): Promise<SaveProofResult> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<SaveProofResult>((resolve) => {
    timer = setTimeout(() => resolve({ status: "unknown" }), proofSaveDeadlineMs);
  });
  return Promise.race([request, deadline]).finally(() => clearTimeout(timer));
}

/**
 * B03 → A04 / B04: once the authoritative list has been re-read, a pending check
 * resolves to whether the unconfirmed link is actually saved.
 */
function resolveOutcome(
  outcome: ProofOutcome | null,
  refreshing: boolean,
  proofs: readonly Proof[],
): ProofOutcome | null {
  if (outcome?.kind !== "checking" || refreshing) return outcome;
  return proofs.some((proof) => proof.url === outcome.url)
    ? { kind: "saved" }
    : { kind: "not-saved" };
}

function EmptyProof({ canAdd }: { canAdd: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--mk-border)] p-6 text-center">
      <p className="font-semibold">No proof added yet</p>
      {canAdd && (
        <p className="mt-1 text-sm text-[var(--mk-muted)]">Add your first delivery link.</p>
      )}
    </div>
  );
}

function RetainedDraft({ label, url }: { label: string; url: string }) {
  return (
    <div className="rounded-xl border border-[var(--mk-border)] bg-[var(--mk-field)] p-4">
      <p className="mb-1 text-sm text-[var(--mk-muted)]">{label}</p>
      <p className="break-all">{url}</p>
    </div>
  );
}

export function ProofWorkspace({
  jobId,
  proofs,
  canAdd,
}: {
  jobId: number;
  proofs: readonly Proof[];
  canAdd: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [saving, setSaving] = useState(false);
  const [rawOutcome, setOutcome] = useState<ProofOutcome | null>(null);
  const [refreshing, startRefresh] = useTransition();
  const inFlight = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const progressButton = useRef<HTMLButtonElement>(null);

  const outcome = resolveOutcome(rawOutcome, refreshing, proofs);
  const kind = outcome?.kind;
  const unresolved = kind === "unknown" || kind === "checking";
  const busy = saving || refreshing;
  const retainedDraft = (kind === "rejected" || unresolved) && draft.trim();

  function openForm() {
    setFieldError("");
    if (kind === "saved") setDraft("");
    if (kind !== "not-saved" && kind !== "rejected") setOutcome(null);
    setOpen(true);
  }

  async function submit() {
    if (inFlight.current || unresolved) return;
    const trimmed = draft.trim();
    const url = parseProjectBriefUrl(trimmed);
    if (!url) {
      setFieldError(trimmed ? proofMessages.invalid : proofMessages.empty);
      inputRef.current?.focus();
      return;
    }
    inFlight.current = true;
    setFieldError("");
    setOutcome(null);
    setSaving(true);
    let result: SaveProofResult;
    try {
      result = await withDeadline(saveProof(String(jobId), url));
    } catch {
      result = { status: "unknown" };
    }
    inFlight.current = false;
    setSaving(false);
    applyResult(result);
  }

  function applyResult(result: SaveProofResult) {
    if (result.status === "saved") {
      setDraft("");
      setOutcome({ kind: "saved" });
      setOpen(false);
      startRefresh(() => router.refresh());
      return;
    }
    if (result.status === "unknown") {
      setOutcome({ kind: "unknown" });
      setOpen(false);
      return;
    }
    const error = describeProofError(result.code);
    if (error.kind === "field") {
      // The dialog stays open so the marketer can correct the link in place.
      setFieldError(error.body);
      setOpen(true);
      inputRef.current?.focus();
      return;
    }
    setOutcome({ kind: "rejected", error });
    setOpen(false);
  }

  function refreshJob() {
    setOutcome(null);
    startRefresh(() => router.refresh());
  }

  function checkSaved() {
    const url = parseProjectBriefUrl(draft.trim());
    if (!url) return setOutcome({ kind: "not-saved" });
    setOutcome({ kind: "checking", url });
    startRefresh(() => router.refresh());
  }

  return (
    <section className="mk-card space-y-4 p-5" aria-labelledby="saved-proof-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="saved-proof-heading" className="font-semibold">
          Saved proof <span className="font-normal text-[var(--mk-muted)]">({proofs.length})</span>
        </h2>
        {canAdd && !unresolved && kind !== "rejected" && (
          <Button ref={addButton} className="mk-primary-button" disabled={busy} onClick={openForm}>
            Add proof
          </Button>
        )}
      </div>

      {saving && !open && (
        <div role="status" className="flex flex-wrap items-center gap-3 text-sm">
          <span>Saving proof…</span>
          <Button
            ref={progressButton}
            variant="outline"
            className="mk-secondary-button"
            onClick={() => setOpen(true)}
          >
            View progress
          </Button>
        </div>
      )}

      {!open && (
        <OutcomeNotice
          outcome={outcome}
          busy={busy}
          onReopen={openForm}
          onCheck={checkSaved}
          onRefreshJob={refreshJob}
        />
      )}

      {retainedDraft && (
        <RetainedDraft label={unresolved ? "Unconfirmed link" : "Draft link"} url={retainedDraft} />
      )}

      {proofs.length > 0 ? <ProofRecordList proofs={proofs} /> : <EmptyProof canAdd={canAdd} />}

      {canAdd && proofs.length > 0 && (
        <p className="text-sm text-[var(--mk-muted)]">
          Saving proof doesn’t complete the job. The creator reviews it before completion.
        </p>
      )}

      <AddProofDialog
        open={open}
        saving={saving}
        draft={draft}
        fieldError={fieldError}
        inputRef={inputRef}
        notice={
          kind === "rejected" || kind === "not-saved" ? (
            <DialogNotice outcome={outcome} />
          ) : undefined
        }
        onDraftChange={(value) => {
          setDraft(value);
          if (fieldError) setFieldError("");
        }}
        onSubmit={submit}
        onClose={() => setOpen(false)}
        finalFocus={() => (saving ? progressButton.current : addButton.current)}
      />
    </section>
  );
}
