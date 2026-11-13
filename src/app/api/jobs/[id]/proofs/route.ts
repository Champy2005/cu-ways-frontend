import { checkProofsRoute, saveProofRoute } from "@/features/proofs/proof-route";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return checkProofsRoute((await context.params).id);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return saveProofRoute(request, (await context.params).id);
}
