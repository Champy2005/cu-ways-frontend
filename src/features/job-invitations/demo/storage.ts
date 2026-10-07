import { isRecord } from "@/lib/api/envelope";
import type { Invitation, Offer } from "../types";
import { validDecline, validateOffer } from "../validation";
import { initialState, type InvitationDemoState } from "./transitions";

const requestStatuses = ["Pending", "Accepted", "Declined", "Closed"];
const offerStatuses = ["Pending", "Accepted", "Rejected", "Withdrawn"];

function isTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T/.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}

function restoreInvitation(value: unknown): Invitation | null {
  if (!isRecord(value)) return null;
  const fixture = initialState.invitations.find((entry) => entry.id === value.id);
  if (!fixture || !requestStatuses.includes(String(value.status))) return null;
  if (value.respondedAt !== null && !isTimestamp(value.respondedAt)) return null;
  if (typeof value.declineNote !== "string") return null;
  if (value.declineReason !== null && typeof value.declineReason !== "string") return null;
  const decline = { reason: value.declineReason as string | null, note: value.declineNote };
  if (!validDecline(decline)) return null;
  if ((value.status === "Accepted" || value.status === "Declined") && value.respondedAt === null)
    return null;
  if (value.status !== "Declined" && (decline.reason !== null || decline.note !== "")) return null;
  return {
    ...fixture,
    status: value.status as Invitation["status"],
    respondedAt: value.respondedAt as string | null,
    declineReason: decline.reason,
    declineNote: decline.note,
  };
}

function restoreOffer(value: unknown, requests: Invitation[]): Offer | null {
  if (!isRecord(value)) return null;
  const request = requests.find((entry) => entry.id === value.requestId);
  if (!request || request.status !== "Accepted") return null;
  if (typeof value.id !== "string" || !value.id || !offerStatuses.includes(String(value.status)))
    return null;
  if (
    typeof value.price !== "string" ||
    typeof value.deliveryDate !== "string" ||
    typeof value.message !== "string"
  )
    return null;
  if (!isTimestamp(value.createdAt)) return null;
  if (value.status === "Withdrawn" ? !isTimestamp(value.withdrawnAt) : value.withdrawnAt !== null)
    return null;
  const input = { price: value.price, deliveryDate: value.deliveryDate, message: value.message };
  if (Object.keys(validateOffer(input, request.job.deadline)).length) return null;
  return {
    ...input,
    id: value.id,
    requestId: request.id,
    status: value.status as Offer["status"],
    createdAt: value.createdAt,
    withdrawnAt: value.withdrawnAt as string | null,
  };
}

export function decodeState(raw: string | null): InvitationDemoState {
  if (!raw) return initialState;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      !isRecord(value) ||
      value.version !== 1 ||
      !Array.isArray(value.invitations) ||
      !Array.isArray(value.offers)
    )
      return initialState;
    const invitations = value.invitations.map(restoreInvitation);
    if (invitations.some((entry) => entry === null)) return initialState;
    const restored = invitations as Invitation[];
    if (
      restored.length !== initialState.invitations.length ||
      new Set(restored.map((entry) => entry.id)).size !== restored.length
    )
      return initialState;
    const offers = value.offers.map((entry) => restoreOffer(entry, restored));
    if (offers.some((entry) => entry === null)) return initialState;
    const restoredOffers = offers as Offer[];
    if (
      new Set(restoredOffers.map((entry) => entry.requestId)).size !== offers.length ||
      new Set(restoredOffers.map((entry) => entry.id)).size !== offers.length
    )
      return initialState;
    return { version: 1, invitations: restored, offers: restoredOffers, revision: 0 };
  } catch {
    return initialState;
  }
}
