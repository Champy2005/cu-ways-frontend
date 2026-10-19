import { serverApiGet } from "@/lib/api/server-client";
import { readSurvey, readSurveys } from "./contracts";
import { ApiError } from "@/lib/api/errors";

export async function getSurveys() {
  return readSurveys(await serverApiGet<unknown>("/api/v1/me/surveys"));
}

export async function getSurvey(id: number) {
  const survey = readSurvey(await serverApiGet<unknown>(`/api/v1/surveys/${id}`));
  if (survey.survey_id !== id)
    throw new ApiError(
      502,
      "invalid_backend_response",
      "The requested survey could not be confirmed.",
    );
  return survey;
}
