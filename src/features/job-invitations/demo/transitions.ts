import type { DeclineInput, Invitation, Offer, OfferInput } from "../types";
import { normalizeOffer, validDecline, validateOffer } from "../validation";
import { DEMO_NOW, initialInvitations, initialOffers } from "./fixtures";
import { bangkokDate } from "../format";

export type InvitationDemoState = {
  version: 1;
  invitations: Invitation[];
  offers: Offer[];
  revision: number;
};
export const initialState: InvitationDemoState = {
  version: 1,
  invitations: initialInvitations,
  offers: initialOffers,
  revision: 0,
};

function requireRequest(state: InvitationDemoState, id: string, status: Invitation["status"]) {
  const request = state.invitations.find((entry) => entry.id === id);
  if (!request) throw new Error("This invitation could not be found.");
  if (request.status !== status)
    throw new Error(
      status === "Pending"
        ? "This invitation is no longer pending. You cannot respond to it again."
        : "Accept this invitation before submitting an offer. Declined or closed invitations cannot receive offers.",
    );
  return request;
}

export function respond(
  state: InvitationDemoState,
  id: string,
  decline?: DeclineInput,
): InvitationDemoState {
  requireRequest(state, id, "Pending");
  if (decline && !validDecline(decline))
    throw new Error("Check your decline reason and note (300 characters maximum).");
  return {
    ...state,
    invitations: state.invitations.map((request) =>
      request.id === id
        ? {
            ...request,
            status: decline ? "Declined" : "Accepted",
            respondedAt: DEMO_NOW,
            declineReason: decline?.reason ?? null,
            declineNote: decline?.note.trim() ?? "",
          }
        : request,
    ),
  };
}

export function submitOffer(
  state: InvitationDemoState,
  id: string,
  input: OfferInput,
): InvitationDemoState {
  const request = requireRequest(state, id, "Accepted");
  if (state.offers.some((offer) => offer.requestId === id))
    throw new Error(
      "An offer already exists for this invitation. Only one offer is allowed, including withdrawn offers.",
    );
  const errors = validateOffer(input, request.job.deadline, bangkokDate(DEMO_NOW));
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  const offer: Offer = {
    ...normalizeOffer(input),
    id: `offer-${id}`,
    requestId: id,
    status: "Pending",
    createdAt: DEMO_NOW,
    withdrawnAt: null,
  };
  return { ...state, offers: [...state.offers, offer] };
}

export function withdrawOffer(state: InvitationDemoState, id: string): InvitationDemoState {
  const offer = state.offers.find((entry) => entry.requestId === id);
  if (!offer || offer.status !== "Pending")
    throw new Error("Only a pending offer can be withdrawn.");
  return {
    ...state,
    offers: state.offers.map((entry) =>
      entry.requestId === id ? { ...entry, status: "Withdrawn", withdrawnAt: DEMO_NOW } : entry,
    ),
  };
}
