import type { User } from "@/features/users/types";

type UserProfileCardProps = {
  user: User;
};

export function UserProfileCard({ user }: UserProfileCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Profile</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">{user.name}</h1>
          <p className="mt-1 text-sm text-zinc-600">{user.email}</p>
        </div>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">User #{user.user_id}</span>
      </div>
      <dl className="mt-8 grid gap-5 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Phone</dt>
          <dd className="mt-1 text-sm text-zinc-900">{user.phone || "Not provided"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Line ID</dt>
          <dd className="mt-1 text-sm text-zinc-900">{user.line_id || "Not provided"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Joined</dt>
          <dd className="mt-1 text-sm text-zinc-900">{new Date(user.created_at).toLocaleDateString()}</dd>
        </div>
      </dl>
    </div>
  );
}
