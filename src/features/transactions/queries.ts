import { serverApiGet } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import type { CurrentReview, Proof, Settlement, TransactionPage, Workspace } from "./types";

export const transactionPageSize = 10;
export const maxJobID = 2_147_483_647;

export function jobPath(id: string) {
  if (!/^[1-9]\d{0,9}$/.test(id) || Number(id) > maxJobID) {
    throw new ApiError(422, "invalid_job", "Select a valid job.");
  }
  return `/api/v1/jobs/${id}`;
}

export async function listTransactions(workspace: Workspace, keyword: string, page: number) {
  const query = new URLSearchParams({
    role: workspace,
    keyword,
    page: String(page),
    page_size: String(transactionPageSize),
  });
  return serverApiGet<TransactionPage>(`/api/v1/me/transactions?${query}`);
}

export function getPayment(id: string) {
  return serverApiGet<Settlement>(`${jobPath(id)}/payments`);
}

export function getProofs(id: string) {
  return serverApiGet<Proof[]>(`${jobPath(id)}/proofs`);
}

export function getReview(id: string) {
  return serverApiGet<CurrentReview>(`${jobPath(id)}/reviews/current`);
}

export async function getJobWorkflow(id: string, userId: number, workspace: Workspace) {
  const job = await getPayment(id);
  const party = workspace === "creator" ? job.creator : job.marketer;
  if (party.user_id !== userId) {
    throw new ApiError(404, "job_not_found", "This job is unavailable in this workspace.");
  }
  const proofs = await getProofs(id);
  return { job, proofs };
}
