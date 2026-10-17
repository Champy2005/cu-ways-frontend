export type CreateJobValues = {
  title: string;
  description: string;
  budget: string;
  deadline: string;
};

export type CreateJobFieldErrors = Partial<
  Record<"title" | "budget" | "deadline" | "surveys", string>
>;

export function createJobFieldErrors(
  values: CreateJobValues,
  selectedSurveyIds: readonly string[],
): CreateJobFieldErrors {
  const errors: CreateJobFieldErrors = {};
  if (!values.title.trim()) errors.title = "Job title is required.";
  if (!values.budget.trim()) errors.budget = "Budget or compensation is required.";
  if (!values.deadline) errors.deadline = "Deadline is required.";
  if (selectedSurveyIds.length === 0) errors.surveys = "Survey selection is required.";
  return errors;
}
