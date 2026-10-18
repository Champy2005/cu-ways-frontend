import { requireSession } from "@/lib/auth/guards";
import { getMarketerOffers } from "@/features/job-invitations/live/api";
import { MyOffersPage } from "@/features/job-invitations/live/my-offers-page";

export const metadata = { title: "My offers | CU Ways" };

export default async function MarketerOffersRoute() {
  await requireSession();
  const { offers, offersUnavailable } = await getMarketerOffers();

  // Filter to valid SavedOffer records
  const validOffers = offers.filter(
    (item): item is { offer: NonNullable<typeof item.offer>; request: typeof item.request } =>
      item.offer !== null,
  );

  return <MyOffersPage initialOffers={validOffers} offersUnavailable={offersUnavailable} />;
}
