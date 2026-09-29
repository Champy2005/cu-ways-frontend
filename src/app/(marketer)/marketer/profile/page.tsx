import { renderMarketerProfile } from "@/features/marketers/profile-route";

export const metadata = { title: "Profile settings | CU Ways" };
export default async function MarketerProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  return renderMarketerProfile(searchParams);
}
