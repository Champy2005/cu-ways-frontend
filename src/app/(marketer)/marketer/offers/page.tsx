import { renderMarketerOffers } from "@/features/job-invitations/live/page-route";

export const metadata = { title: "My offers | CU Ways" };

export default async function MarketerOffersRoute() {
  return renderMarketerOffers();
}
