import { withdrawOfferRoute } from "@/features/job-invitations/live/api-route";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return withdrawOfferRoute(request, (await context.params).id);
}
