import { listMarketerOffers } from "@/features/job-invitations/live/api-route";

export async function GET() {
  return listMarketerOffers();
}
