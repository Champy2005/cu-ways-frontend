import { reportPage } from "@/features/admin/reports";
import { ReportPagination } from "@/features/admin/report-table";
import { InlineError } from "@/components/feedback/inline-error";
import { FeaturePlaceholder } from "@/components/feedback/feature-placeholder";
import { getDisplayError } from "@/lib/api/errors";
import { listUsers } from "@/features/users/api";
import { UserTable } from "@/features/users/components/user-table";

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  let users;
  try {
    users = await listUsers(reportPage((await searchParams).page));
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

  return (
    <div className="space-y-4">
      <UserTable data={users} />
      <ReportPagination
        path="/admin/users"
        page={users.page}
        pageSize={users.page_size}
        total={users.total}
      />
    </div>
  );
}
