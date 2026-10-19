import { renderInvitations } from "@/features/job-invitations/live/page-route";

export const metadata = { title: "Submit an offer | CU Ways" };

export default async function CreateOfferPage({
  searchParams,
}: {
  searchParams: Promise<{ requestId?: string }>;
}) {
  return renderInvitations((await searchParams).requestId, true);
}
