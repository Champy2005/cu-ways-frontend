import { checkPaymentRoute, recordPaymentRoute } from "@/features/jobs/payment-route";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return checkPaymentRoute((await context.params).id);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return recordPaymentRoute(request, (await context.params).id);
}
