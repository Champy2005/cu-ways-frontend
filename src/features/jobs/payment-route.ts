import { isAllowedFrontendOrigin } from "@/lib/auth/origin";
import { checkJobPayment, recordJobPayment } from "./payment-actions";

/**
 * Browser-facing payment endpoints (`/api/jobs/:id/payment`). The payment page
 * calls these with fetch rather than server actions: Next.js runs server
 * actions one at a time and keeps them pending together, so a save whose
 * response never arrived would block the status check behind it. A fetch can
 * be aborted on its own timeout and never queues behind another request.
 *
 * Both return 200 with the save or check result as `data`; the result itself
 * says what happened, including backend refusals.
 */

const NO_STORE = { "Cache-Control": "no-store" };

function errorResponse(status: number, code: string, message: string) {
  return Response.json(
    { status: "error", error: { code, message } },
    { status, headers: NO_STORE },
  );
}

function parseJobId(raw: string): number | null {
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id <= 2_147_483_647 ? id : null;
}

export async function recordPaymentRoute(request: Request, rawJobId: string): Promise<Response> {
  // Same-origin only, so another site cannot make a Creator's browser record a payment.
  if (!isAllowedFrontendOrigin(request.headers.get("origin"))) {
    return errorResponse(403, "invalid_origin", "Request origin is not allowed.");
  }
  const jobId = parseJobId(rawJobId);
  if (jobId === null) return errorResponse(422, "validation_error", "Choose a valid job.");
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(422, "validation_error", "Check the payment method and amount.");
  }
  const { method, amount } = (typeof body === "object" && body !== null ? body : {}) as Record<
    string,
    unknown
  >;
  const result = await recordJobPayment(jobId, method, amount);
  return Response.json({ status: "success", data: result }, { headers: NO_STORE });
}

export async function checkPaymentRoute(rawJobId: string): Promise<Response> {
  const jobId = parseJobId(rawJobId);
  if (jobId === null) return errorResponse(422, "validation_error", "Choose a valid job.");
  const result = await checkJobPayment(jobId);
  return Response.json({ status: "success", data: result }, { headers: NO_STORE });
}
