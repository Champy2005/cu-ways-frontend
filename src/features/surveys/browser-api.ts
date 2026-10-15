import { browserApiRequest } from "@/lib/api/browser-client";
import type { CreateSurveyRequest, Survey } from "@/features/surveys/types";

export function createSurvey(input: CreateSurveyRequest): Promise<Survey> {
  return browserApiRequest<Survey>("/api/surveys", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
