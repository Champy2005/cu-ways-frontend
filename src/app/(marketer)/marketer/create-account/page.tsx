import { renderMarketerProfile } from "@/features/marketers/profile-route";

export const metadata = { title: "Create marketer account | CU Ways" };
export default async function MarketerCreateAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  return renderMarketerProfile(searchParams, "create");
}
