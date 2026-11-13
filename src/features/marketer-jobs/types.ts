import type { Settlement } from "@/features/transactions/types";

export const jobStatuses = ["Accepted", "In Progress", "Completed", "Cancelled"] as const;
export type JobStatus = (typeof jobStatuses)[number];
export type JobFilter = JobStatus | "active" | "all";

export type HiredJob = {
  id: number;
  status: JobStatus;
  surveys: { id: number; title: string; url?: string | null }[];
  creator: string;
  price: string;
  deliveryDate: string | null;
  deadline: string | null;
  targetResponses: number | null;
  briefUrl: string | null;
  completion?: CompletionEvidence;
  contact?: Settlement["contact"];
};

export type DeliveryProof = {
  id: number;
  url: string;
  savedAt: string;
};

export type CompletionEvidence =
  | {
      status: "ready";
      proofs: DeliveryProof[];
      acceptedOffer: boolean;
      paid: boolean;
      marketer: string;
      completedAt: string | null;
    }
  | { status: "error" };

export type JobFailure = "error" | "unavailable" | "forbidden" | "expired" | "invalid";
export type JobsResult<T> = { status: "success"; data: T } | { status: JobFailure };
export type StartResult =
  { status: "started" | "already-started"; job: HiredJob } | { status: "recheck" | JobFailure };

/** A confirmed start can advance an older Accepted read, never undo a later terminal read. */
export function applyStartedJob(job: HiredJob, outcome?: StartResult): HiredJob {
  if (job.status === "Accepted" && outcome && "job" in outcome) return outcome.job;
  return job;
}

export const jobFilters: { value: JobFilter; label: string }[] = [
  { value: "active", label: "Active jobs" },
  ...jobStatuses.map((value) => ({ value, label: value })),
  { value: "all", label: "All my jobs" },
];

export function parseJobFilter(value: string | null | undefined): JobFilter {
  return jobFilters.find((filter) => filter.value === value)?.value ?? "active";
}

export function filterJobs(jobs: HiredJob[], filter: JobFilter) {
  return jobs.filter((job) => {
    if (filter === "all") return true;
    if (filter === "active") return job.status === "Accepted" || job.status === "In Progress";
    return job.status === filter;
  });
}

export function jobsHref(filter: JobFilter = "active", page = 1) {
  const query = new URLSearchParams({ status: filter, page: String(page) });
  return `/marketer/jobs?${query}`;
}

export function formatJobPrice(value: string) {
  return `${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value))} THB`;
}

export function formatJobDate(value: string | null) {
  if (!value) return "Not specified";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Not specified";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(date);
}
