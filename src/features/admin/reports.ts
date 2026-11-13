import { serverApiGet } from "@/lib/api/server-client";
import type { components } from "@/lib/api/generated/backend";

export type AdminJobPage = components["schemas"]["AdminJobPage"];
export type FlaggedMarketerPage = components["schemas"]["FlaggedMarketerPage"];
export const jobStatuses = [
  "Pending",
  "Accepted",
  "In Progress",
  "Completed",
  "Cancelled",
] as const;

export function reportPage(value: string | string[] | undefined) {
  const page = typeof value === "string" ? Number(value) : 1;
  return Number.isInteger(page) && page > 0 && page <= 1_000_000 ? page : 1;
}

export function listAdminJobs(page: number, status: string) {
  const query = new URLSearchParams({ page: String(page) });
  if (status) query.set("status", status);
  return serverApiGet<AdminJobPage>(`/api/v1/admin/jobs?${query}`);
}

export function listFlaggedMarketers(page: number) {
  return serverApiGet<FlaggedMarketerPage>(`/api/v1/admin/flagged-marketers?page=${page}`);
}
