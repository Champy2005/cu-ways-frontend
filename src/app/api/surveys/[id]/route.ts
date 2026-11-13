import { serverApiRequest } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/errors";
import { isAllowedFrontendOrigin } from "@/lib/auth/origin";
import { getSession } from "@/lib/auth/session";
import { readSurvey } from "@/features/surveys/contracts";
import {
  isSurveyId,
  normalizeCreateSurveyInput,
  validateCreateSurveyInput,
} from "@/features/surveys/schemas";

function failure(status: number, code: string, message: string) {
  return Response.json({ status: "error", error: { code, message } }, { status });
}

async function mutate(request: Request, context: RouteContext<"/api/surveys/[id]">) {
  if (!isAllowedFrontendOrigin(request.headers.get("origin")))
    return failure(403, "invalid_origin", "Request origin is not allowed.");
  const session = await getSession();
  if (!session) return failure(401, "unauthorized", "Please sign in again.");
  const { id } = await context.params;
  const surveyId = Number(id);
  if (!/^[1-9]\d*$/.test(id) || !isSurveyId(surveyId))
    return failure(404, "survey_not_found", "Survey unavailable.");

  const method = request.method;
  let body: string | undefined;
  if (method === "PATCH") {
    const input: unknown = await request.json().catch(() => null);
    if (!validateCreateSurveyInput(input))
      return failure(400, "invalid_survey_fields", "Check the survey metadata and try again.");
    body = JSON.stringify(normalizeCreateSurveyInput(input));
  }

  try {
    const data = await serverApiRequest<unknown>(`/api/v1/surveys/${surveyId}`, { method, body });
    if (method === "PATCH") {
      const saved = readSurvey(data);
      if (saved.survey_id !== surveyId || saved.user_id !== session.userId)
        throw new ApiError(
          502,
          "invalid_backend_response",
          "The survey update could not be confirmed.",
        );
    }
    return Response.json({ status: "success", data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ApiError) return failure(error.status, error.code, error.message);
    return failure(
      503,
      "backend_unavailable",
      "The change could not be confirmed. Check My surveys.",
    );
  }
}

export const PATCH = mutate;
export const DELETE = mutate;
