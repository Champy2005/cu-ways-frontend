import type { components } from "@/lib/api/generated/backend";
import { isRecord } from "@/lib/api/envelope";
import { ApiError } from "@/lib/api/errors";
import { serverApiGet } from "@/lib/api/server-client";
import type { CompletionEvidence, DeliveryProof } from "./types";

type Settlement = components["schemas"]["JobSettlement"];

function readProofs(value: unknown, jobId: number): DeliveryProof[] {
  if (!Array.isArray(value)) throw new Error("Delivery evidence could not be verified.");
  const proofs: DeliveryProof[] = [];
  const ids = new Set<number>();
  for (const item of value) {
    if (!isRecord(item) || item.job_id !== jobId) throw new Error("Invalid delivery evidence.");
    // Only a Proof row satisfies the guard. Briefs and other attachments never do.
    if (item.attachment_type !== "Proof") continue;
    if (
      !Number.isSafeInteger(item.attachment_id) ||
      Number(item.attachment_id) < 1 ||
      typeof item.url !== "string" ||
      typeof item.upload_at !== "string" ||
      !Number.isFinite(Date.parse(item.upload_at)) ||
      ids.has(Number(item.attachment_id))
    ) {
      throw new Error("Invalid delivery proof.");
    }
    ids.add(Number(item.attachment_id));
    proofs.push({ id: Number(item.attachment_id), url: item.url, savedAt: item.upload_at });
  }
  return proofs.sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt) || b.id - a.id);
}

/** Called only after the settlement endpoint and hired-offer read authorize this Marketer. */
export async function getCompletionEvidence(saved: Settlement): Promise<CompletionEvidence> {
  try {
    const proofs = readProofs(
      await serverApiGet<unknown>(`/api/v1/jobs/${saved.job_id}/proofs`, {
        signal: AbortSignal.timeout(10_000),
      }),
      saved.job_id,
    );
    return {
      status: "ready",
      proofs,
      // The settlement endpoint only returns a hired Marketer's matching, still-Accepted offer.
      acceptedOffer: true,
      paid:
        saved.payment?.payment_status === "Paid" &&
        Number(saved.payment.amount) === Number(saved.accepted_price),
      marketer: saved.marketer.name,
      completedAt: saved.completed_at,
    };
  } catch (error) {
    // Revoked read permission must remove all private job data, including the summary.
    if (error instanceof ApiError && [401, 403, 404].includes(error.status)) throw error;
    return { status: "error" };
  }
}
