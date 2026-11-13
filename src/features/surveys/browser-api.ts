import { browserApiRequest } from "@/lib/api/browser-client";
import { readSurvey } from "./contracts";
import type { CreateSurveyRequest, Survey } from "./types";

export async function updateSurvey(id: number, input: CreateSurveyRequest): Promise<Survey> {
  return readSurvey(
    await browserApiRequest<unknown>(`/api/surveys/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  );
}

export function deleteSurvey(id: number) {
  return browserApiRequest<{ survey_id: number; deleted: boolean }>(`/api/surveys/${id}`, {
    method: "DELETE",
  });
}

export async function createSurvey(input: CreateSurveyRequest): Promise<Survey> {
  return readSurvey(
    await browserApiRequest<unknown>("/api/surveys", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}
