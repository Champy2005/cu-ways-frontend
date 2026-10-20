export type CreateJobValues = {
  title: string;
  description: string;
  budget: string;
  deadline: string;
};

export type CreateJobFieldErrors = Partial<
  Record<"title" | "description" | "budget" | "deadline" | "surveys", string>
>;

export function createJobFieldErrors(
  values: CreateJobValues,
  selectedSurveyIds: readonly string[],
): CreateJobFieldErrors {
  const errors: CreateJobFieldErrors = {};
  if (!values.title.trim()) errors.title = "Job title is required.";
  if ([...values.title.trim()].length > 200) errors.title = "Use 200 characters or fewer.";
  if ([...values.description].length > 5000) errors.description = "Use 5000 characters or fewer.";
  if (!values.budget.trim()) errors.budget = "Budget or compensation is required.";
  else if (!/^\d{1,8}(?:\.\d{1,2})?$/.test(values.budget.trim()))
    errors.budget = "Enter an amount in THB, up to 99,999,999.99.";
  if (!values.deadline) errors.deadline = "Deadline is required.";
  else if (
    !/^\d{4}-\d{2}-\d{2}$/.test(values.deadline) ||
    !Number.isFinite(Date.parse(`${values.deadline}T00:00:00Z`)) ||
    new Date(`${values.deadline}T00:00:00Z`).toISOString().slice(0, 10) !== values.deadline
  )
    errors.deadline = "Enter a valid date.";
  if (selectedSurveyIds.length === 0) errors.surveys = "Survey selection is required.";
  return errors;
}
