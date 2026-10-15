import { browserApiRequest } from "@/lib/api/browser-client";
import type { DeclineInput, OfferInput } from "../types";
import { normalizeOffer } from "../validation";
import { readEntries, readOffer, readRequest } from "./contracts";

export async function reloadInvitations(requestId?: string) {
  const query = requestId ? `?requestId=${encodeURIComponent(requestId)}` : "";
  return readEntries(await browserApiRequest<unknown>(`/api/job-requests${query}`));
}
export async function respondToInvitation(id: number, input?: DeclineInput) {
  const path = `/api/job-requests/${id}/${input ? "decline" : "accept"}`;
  return readRequest(
    await browserApiRequest<unknown>(path, {
      method: "POST",
      body: input ? JSON.stringify(input) : undefined,
    }),
  );
}
export async function submitInvitationOffer(id: number, input: OfferInput) {
  const normalized = normalizeOffer(input);
  return readOffer(
    await browserApiRequest<unknown>(`/api/job-requests/${id}/offers`, {
      method: "POST",
      body: JSON.stringify({
        offered_price: normalized.price,
        delivery_date: normalized.deliveryDate,
        message: normalized.message || null,
      }),
    }),
  );
}
