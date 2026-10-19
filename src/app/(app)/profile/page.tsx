import { redirect } from "next/navigation";

/** Contact settings moved into the creator workspace (US-003). */
export default function ProfilePage() {
  redirect("/creator/settings");
}
