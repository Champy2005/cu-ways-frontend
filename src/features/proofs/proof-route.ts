import { isAllowedFrontendOrigin } from "@/lib/auth/origin";
import { checkJobProofs, saveJobProof } from "./proof-actions";

/**
 * Browser-facing proof endpoints (`/api/jobs/:id/proofs`). The proof workspace
 * calls these with fetch rather than server actions, so a save whose response
 * never arrives cannot block the "Check saved proof" read behind it.
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

export async function saveProofRoute(request: Request, rawJobId: string): Promise<Response> {
  // Same-origin only, so another site cannot make a marketer's browser add proof.
  if (!isAllowedFrontendOrigin(request.headers.get("origin"))) {
    return errorResponse(403, "invalid_origin", "Request origin is not allowed.");
  }
  const jobId = parseJobId(rawJobId);
  if (jobId === null) return errorResponse(422, "validation_error", "Choose a valid job.");
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(422, "validation_error", "Check the delivery link.");
  }
  const { url } = (typeof body === "object" && body !== null ? body : {}) as Record<
    string,
    unknown
  >;
  const result = await saveJobProof(jobId, url);
  return Response.json({ status: "success", data: result }, { headers: NO_STORE });
}

export async function checkProofsRoute(rawJobId: string): Promise<Response> {
  const jobId = parseJobId(rawJobId);
  if (jobId === null) return errorResponse(422, "validation_error", "Choose a valid job.");
  const result = await checkJobProofs(jobId);
  return Response.json({ status: "success", data: result }, { headers: NO_STORE });
}
