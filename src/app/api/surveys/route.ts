import { fetchBackend, readBackendPayload } from "@/lib/api/backend-client";
import { extractData } from "@/lib/api/envelope";
import { ApiError, apiErrorFromResponse } from "@/lib/api/errors";
import { isAllowedFrontendOrigin } from "@/lib/auth/origin";
import { getSession } from "@/lib/auth/session";
import { readSurvey } from "@/features/surveys/contracts";
import { normalizeCreateSurveyInput, validateCreateSurveyInput } from "@/features/surveys/schemas";

function errorResponse(status: number, code: string, message: string): Response {
  return Response.json({ status: "error", error: { code, message } }, { status });
}

export async function POST(request: Request): Promise<Response> {
  if (!isAllowedFrontendOrigin(request.headers.get("origin")))
    return errorResponse(403, "invalid_origin", "Request origin is not allowed.");
  const session = await getSession();
  if (!session) return errorResponse(401, "unauthorized", "Please sign in again.");
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(422, "validation_error", "Check the submitted fields and try again.");
  }
  if (!validateCreateSurveyInput(body))
    return errorResponse(422, "validation_error", "Check the submitted fields and try again.");
  try {
    const upstream = await fetchBackend("/api/v1/surveys", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.token}` },
      body: JSON.stringify(normalizeCreateSurveyInput(body)),
    });
    const payload = await readBackendPayload(upstream);
    if (!upstream.ok) throw apiErrorFromResponse(upstream.status, payload);
    const survey = readSurvey(extractData<unknown>(payload));
    if (upstream.status !== 201 || survey.user_id !== session.userId)
      return errorResponse(
        502,
        "invalid_backend_response",
        "The saved survey could not be confirmed. Check your surveys before trying again.",
      );
    return Response.json(
      { status: "success", data: survey },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof ApiError) return errorResponse(error.status, error.code, error.message);
    return errorResponse(
      503,
      "backend_unavailable",
      "Survey creation could not be confirmed. Check your surveys before trying again.",
    );
  }
}
