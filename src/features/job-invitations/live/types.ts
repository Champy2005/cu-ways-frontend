import type { components } from "@/lib/api/generated/backend";

export type ReceivedRequest = components["schemas"]["MarketerJobRequest"];
export type SavedRequest = components["schemas"]["JobRequest"];
export type SavedOffer = components["schemas"]["Offer"];
export type InvitationEntry = {
  request: ReceivedRequest;
  offer: SavedOffer | null;
  offersUnavailable: boolean;
};
