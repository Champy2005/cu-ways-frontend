import Link from "next/link";

import type { UserList } from "@/features/users/types";

type UserTableProps = {
  data: UserList;
};

export function UserTable({ data }: UserTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Administration
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">Users</h1>
        </div>
        <p className="text-sm text-zinc-500">{data.total} active users</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-6 py-3 font-medium">User</th>
              <th className="px-6 py-3 font-medium">Phone</th>
              <th className="px-6 py-3 font-medium">Line ID</th>
              <th className="px-6 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {data.items.map((user) => (
              <tr key={user.user_id} className="hover:bg-zinc-50">
                <td className="px-6 py-4">
                  <Link
                    href={`/admin/users/${user.user_id}`}
                    className="font-medium text-zinc-950 hover:underline"
                  >
                    {user.name}
                  </Link>
                  <p className="mt-1 text-xs text-zinc-500">{user.email}</p>
                </td>
                <td className="px-6 py-4 text-zinc-600">{user.phone || "—"}</td>
                <td className="px-6 py-4 text-zinc-600">{user.line_id || "—"}</td>
                <td className="px-6 py-4 text-zinc-600">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.items.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-zinc-500">No users found.</p>
      ) : null}
    </div>
  );
}
