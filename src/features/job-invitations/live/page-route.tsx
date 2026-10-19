import { ApiError } from "@/lib/api/errors";
import { requireSession } from "@/lib/auth/guards";
import { getInvitations, getMarketerOffers } from "./api";
import { failureMessage } from "./failures";
import { InvitationFailure } from "./feedback";
import { LiveInvitationsPage } from "./invitations-page";
import { LiveOfferPage } from "./offer-page";
import { MyOffersPage } from "./my-offers-page";
import { isRequestId } from "./validation";

export async function renderInvitations(requestId?: string, offer = false) {
  await requireSession();
  if (offer && (!requestId || !isRequestId(requestId)))
    return (
      <InvitationFailure message="Choose an accepted invitation to create or view an offer." />
    );
  try {
    const entries = await getInvitations(requestId);
    return offer ? (
      <LiveOfferPage key={requestId} initial={entries} />
    ) : (
      <LiveInvitationsPage initial={entries} referenceTime={new Date().toISOString()} />
    );
  } catch (error) {
    return (
      <InvitationFailure
        message={failureMessage(error)}
        status={error instanceof ApiError ? error.status : undefined}
      />
    );
  }
}

export async function renderMarketerOffers() {
  await requireSession();
  try {
    const { offers, offersUnavailable } = await getMarketerOffers();
    return <MyOffersPage initialOffers={offers} offersUnavailable={offersUnavailable} />;
  } catch (error) {
    return (
      <InvitationFailure
        title="My offers unavailable"
        message={
          error instanceof ApiError
            ? error.message
            : "Offers are temporarily unavailable. Please try again."
        }
        status={error instanceof ApiError ? error.status : undefined}
      />
    );
  }
}
