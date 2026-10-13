import { loadCreatorJobs } from "@/features/jobs/api";
import { CreatorJobPicker } from "@/features/jobs/components/creator-job-picker";

export const metadata = { title: "Invite marketers to a job | CU Ways" };

export default async function InviteStartPage() {
  const state = await loadCreatorJobs();
  return <CreatorJobPicker state={state} />;
}
