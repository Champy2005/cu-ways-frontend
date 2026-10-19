import { mutateInvitation } from "@/features/job-invitations/live/api-route";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return mutateInvitation(request, (await context.params).id, "decline");
}
