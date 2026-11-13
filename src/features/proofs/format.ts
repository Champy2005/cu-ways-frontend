import type { Proof } from "@/features/transactions/types";

const proofTime = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Bangkok",
});

/** "28 Oct 2026, 14:20 ICT" — the server timestamp shown in Bangkok time. */
export function formatProofTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";
  const parts = Object.fromEntries(
    proofTime.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return `${parts.day} ${parts.month} ${parts.year}, ${parts.hour}:${parts.minute} ICT`;
}

/** Newest first; ties fall back to the higher attachment id. */
export function sortProofsNewestFirst(proofs: readonly Proof[]): Proof[] {
  return [...proofs].sort(
    (a, b) =>
      Date.parse(b.upload_at) - Date.parse(a.upload_at) || b.attachment_id - a.attachment_id,
  );
}
