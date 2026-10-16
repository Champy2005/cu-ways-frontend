import type { JobSurveyOption } from "@/features/jobs/types";

// Temporary fixtures for the create-job UI. Replace with creator surveys when connected.
export const MOCK_JOB_SURVEYS: readonly JobSurveyOption[] = [
  {
    id: "SV-104",
    title: "Campus Mobility Study",
    targetResponses: 200,
  },
  {
    id: "SV-118",
    title: "Green Habits 2026",
    targetResponses: 150,
  },
  {
    id: "SV-099",
    title: "Student Dining Pulse",
    targetResponses: 100,
  },
  {
    id: "SV-087",
    title: "Library Experience",
    targetResponses: 250,
  },
];
