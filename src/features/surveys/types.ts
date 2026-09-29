export interface Survey {
  survey_id: number;
  user_id: number;
  title: string;
  description: string | null;
  survey_link: string;
  target_group: string | null;
  desired_responses: number | null;
  deadline: string | null;
  created_at: string;
}

export interface CreateSurveyRequest {
  title: string;
  survey_link: string;
  description?: string | null;
  target_group?: string | null;
  desired_responses?: number | null;
  deadline?: string | null;
}
