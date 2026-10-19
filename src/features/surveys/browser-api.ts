import { browserApiRequest } from "@/lib/api/browser-client";
import { readSurvey } from "./contracts";
import type { CreateSurveyRequest, Survey } from "./types";

export async function createSurvey(input: CreateSurveyRequest): Promise<Survey> {
  return readSurvey(
    await browserApiRequest<unknown>("/api/surveys", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}
