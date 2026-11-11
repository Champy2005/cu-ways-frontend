import type { HiredJob } from "./types";

export type CompletionRequirement = {
  label: string;
  met: boolean;
  description?: string;
  blocker: string;
};

export function completionRequirements(job: HiredJob): CompletionRequirement[] {
  const evidence = job.completion;
  if (evidence?.status !== "ready") return [];
  return [
    {
      label: job.status === "Completed" ? "Completed status" : "In Progress status",
      met: job.status === "In Progress" || job.status === "Completed",
      blocker: "The job must be In Progress.",
    },
    {
      label: "Proof of delivery",
      met: evidence.proofs.length > 0,
      description: evidence.proofs.length ? undefined : "No delivery proof saved.",
      blocker: "Add delivery proof. Brief files and other attachments do not qualify.",
    },
    {
      label: "Accepted offer",
      met: evidence.acceptedOffer,
      description: evidence.acceptedOffer
        ? undefined
        : "The selected offer must belong to this job.",
      blocker: "The selected offer must belong to this job and still be Accepted.",
    },
    {
      label: "Payment is Paid",
      met: evidence.paid,
      description: evidence.paid ? undefined : "Payment is not Paid for the agreed amount.",
      blocker: "Payment must be Paid for the agreed amount.",
    },
  ];
}

export function formatEvidenceTime(value: string | null | undefined): string | null {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
  return `${parts} ICT`;
}
