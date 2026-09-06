import { InlineError } from "@/components/feedback/inline-error";
import { FeaturePlaceholder } from "@/components/feedback/feature-placeholder";
import { getDisplayError } from "@/lib/api/errors";
import { listUsers } from "@/features/users/api";
import { UserTable } from "@/features/users/components/user-table";

export default async function AdminUsersPage() {
  let users;
  try {
    users = await listUsers();
  } catch (error) {
    return (
      <div className="space-y-6">
        <FeaturePlaceholder
          eyebrow="Administration"
          title="Users"
          description="Manage active CU Ways accounts."
        />
        <InlineError message={getDisplayError(error)} />
      </div>
    );
  }

  return <UserTable data={users} />;
}
