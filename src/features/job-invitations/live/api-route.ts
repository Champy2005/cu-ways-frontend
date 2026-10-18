import { fetchBackend, readBackendPayload } from "@/lib/api/backend-client";
import { extractData } from "@/lib/api/envelope";
import { ApiError, apiErrorFromResponse } from "@/lib/api/errors";
import { isAllowedFrontendOrigin } from "@/lib/auth/origin";
import { getSession } from "@/lib/auth/session";
import { getInvitations } from "./api";
import { invalidResponse, readOffer, readRequest } from "./contracts";
import { isRequestId, validLiveDecline, validOfferBody } from "./validation";

function errorResponse(status: number, code: string, message: string) {
  return Response.json({ status: "error", error: { code, message } }, { status });
}
export function invitationError(error: unknown): Response {
  if (error instanceof ApiError) return errorResponse(error.status, error.code, error.message);
  return errorResponse(
    503,
    "backend_unavailable",
    "Invitations are temporarily unavailable. Please try again.",
  );
}

export async function listInvitations(request: Request): Promise<Response> {
  if (!(await getSession())) return errorResponse(401, "unauthorized", "Please sign in again.");
  const id = new URL(request.url).searchParams.get("requestId") ?? undefined;
  if (id !== undefined && !isRequestId(id))
    return errorResponse(422, "validation_error", "Choose a valid invitation.");
  try {
    return Response.json(
      { status: "success", data: await getInvitations(id) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return invitationError(error);
  }
}

type Action = "accept" | "decline" | "offers";
async function readBody(request: Request, action: Action): Promise<unknown> {
  if (action === "accept") return undefined;
  const value: unknown = await request.json();
  if (action === "decline" && validLiveDecline(value))
    return { reason: value.reason, note: value.note.trim() || null };
  if (action === "offers" && validOfferBody(value)) return value;
  throw new Error("invalid input");
}

export async function mutateInvitation(
  request: Request,
  id: string,
  action: Action,
): Promise<Response> {
  if (!isAllowedFrontendOrigin(request.headers.get("origin")))
    return errorResponse(403, "invalid_origin", "Request origin is not allowed.");
  const session = await getSession();
  if (!session) return errorResponse(401, "unauthorized", "Please sign in again.");
  if (!isRequestId(id)) return errorResponse(422, "validation_error", "Choose a valid invitation.");
  let body: unknown;
  try {
    body = await readBody(request, action);
  } catch {
    return errorResponse(422, "validation_error", "Check the submitted fields and try again.");
  }
  try {
    const upstream = await fetchBackend(`/api/v1/me/job-requests/${id}/${action}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.token}` },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = await readBackendPayload(upstream);
    if (!upstream.ok) throw apiErrorFromResponse(upstream.status, payload);
    const data =
      action === "offers"
        ? readOffer(extractData<unknown>(payload))
        : readRequest(extractData<unknown>(payload));
    if (data.job_request_id !== Number(id) || data.marketer_id !== session.userId)
      return invalidResponse();
    return Response.json({ status: "success", data }, { status: upstream.status });
  } catch (error) {
    return invitationError(error);
  }
}

export async function withdrawOfferRoute(request: Request, id: string): Promise<Response> {
  if (!isAllowedFrontendOrigin(request.headers.get("origin")))
    return errorResponse(403, "invalid_origin", "Request origin is not allowed.");
  const session = await getSession();
  if (!session) return errorResponse(401, "unauthorized", "Please sign in again.");
  if (!isRequestId(id)) return errorResponse(422, "validation_error", "Choose a valid offer.");
  try {
    const upstream = await fetchBackend(`/api/v1/me/offers/${id}/withdraw`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.token}` },
    });
    const payload = await readBackendPayload(upstream);
    if (!upstream.ok) throw apiErrorFromResponse(upstream.status, payload);
    const data = readOffer(extractData<unknown>(payload));
    if (data.offer_id !== Number(id) || data.marketer_id !== session.userId)
      return invalidResponse();
    return Response.json({ status: "success", data }, { status: upstream.status });
  } catch (error) {
    return invitationError(error);
  }
}
