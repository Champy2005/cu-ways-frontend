import { loadCreatorJobs } from "@/features/jobs/api";
import { CreatorOffersJobPicker } from "@/features/jobs/components/creator-offers-job-picker";

export const metadata = { title: "Compare Job Offers | CU Ways" };

export default async function OffersStartPage() {
  const state = await loadCreatorJobs();
  return <CreatorOffersJobPicker state={state} />;
}
