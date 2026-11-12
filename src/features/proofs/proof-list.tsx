import { parseProjectBriefUrl } from "@/features/jobs/project-brief";
import type { Proof } from "@/features/transactions/types";
import { formatProofTime, sortProofsNewestFirst } from "./format";

export function ProofRecordList({ proofs }: { proofs: readonly Proof[] }) {
  return (
    <ul className="divide-y divide-[var(--mk-border)]" aria-label="Saved proof links">
      {sortProofsNewestFirst(proofs).map((proof) => {
        const url = parseProjectBriefUrl(proof.url);
        return (
          <li key={proof.attachment_id} className="min-w-0 space-y-1 py-3 first:pt-0 last:pb-0">
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 max-w-full items-center font-medium break-all text-[var(--mk-secondary)] underline underline-offset-2"
              >
                {url}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : (
              <p className="break-all text-[var(--mk-muted)]">
                {proof.url} <span className="text-sm">(link unavailable)</span>
              </p>
            )}
            <p className="text-sm text-[var(--mk-muted)]">
              Saved <time dateTime={proof.upload_at}>{formatProofTime(proof.upload_at)}</time>
            </p>
          </li>
        );
      })}
    </ul>
  );
}
