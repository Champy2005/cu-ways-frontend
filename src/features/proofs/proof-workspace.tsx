"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { parseProjectBriefUrl } from "@/features/jobs/project-brief";
import type { Proof } from "@/features/transactions/types";
import { AddProofDialog } from "./add-proof-dialog";
import { describeProofError } from "./errors";
import type { CheckProofsResult, SaveProofResult } from "./proof-actions";
import { requestProofCheck, requestProofSave } from "./proof-client";
import { PROOF_SERVER_BOUND_MS } from "./proof-limits";
import { DialogNotice, OutcomeNotice, type ProofOutcome } from "./proof-notices";
import { ProofRecordList } from "./proof-list";

export const proofMessages = {
  empty: "Enter a delivery link.",
  invalid: "Enter a full link that starts with http:// or https://.",
} as const;

const currentTime = () => Date.now();

/** States where the save outcome is not known yet, so another save must wait for a check. */
const unresolvedKinds = new Set<ProofOutcome["kind"] | undefined>([
  "unknown",
  "checking",
  "check-failed",
]);
const isUnresolved = (kind: ProofOutcome["kind"] | undefined) => unresolvedKinds.has(kind);

/**
 * B03 → A04 / B04: decide from the authoritative list whether the unconfirmed link
 * was saved. A link that is missing while the server could still be saving it is
 * not reported as "not saved", so the marketer cannot save it twice.
 */
function outcomeFromCheck(result: CheckProofsResult, url: string, sentAt: number): ProofOutcome {
  if (result.status === "error") {
    const error = describeProofError(result.code);
    return error.kind === "session" || error.kind === "access"
      ? { kind: "rejected", error }
      : { kind: "check-failed" };
  }
  if (result.proofs.some((proof) => proof.url === url)) return { kind: "saved" };
  if (currentTime() - sentAt < PROOF_SERVER_BOUND_MS) return { kind: "unknown", stillSaving: true };
  return { kind: "not-saved" };
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
  const [outcome, setOutcome] = useState<ProofOutcome | null>(null);
  const [refreshing, startRefresh] = useTransition();
  const inFlight = useRef(false);
  /** When the last save was sent; the server may still be saving it until PROOF_SERVER_BOUND_MS later. */
  const sentAt = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const progressButton = useRef<HTMLButtonElement>(null);

  const kind = outcome?.kind;
  const unresolved = isUnresolved(kind);
  const busy = saving || refreshing || kind === "checking";
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
    sentAt.current = currentTime();
    setFieldError("");
    setOutcome(null);
    setSaving(true);
    // Never rejects: a lost or late (12 s) response comes back as "unknown".
    const result = await requestProofSave(jobId, url);
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

  /** B03 → A04 / B04: read the authoritative list before deciding whether a retry is safe. */
  async function checkSaved() {
    const url = parseProjectBriefUrl(draft.trim());
    if (!url) return setOutcome({ kind: "not-saved" });
    setOutcome({ kind: "checking" });
    const next = outcomeFromCheck(await requestProofCheck(jobId), url, sentAt.current);
    setOutcome(next);
    if (next.kind === "saved") {
      setDraft("");
      startRefresh(() => router.refresh());
    }
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
