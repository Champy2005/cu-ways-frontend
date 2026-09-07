"use client";

import { useContactForm } from "@/features/users/use-contact-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateCurrentUser } from "@/features/users/browser-api";
import type { User } from "@/features/users/types";

type UserProfileCardProps = {
  user: User;
};

export function UserProfileCard({ user: initialUser }: UserProfileCardProps) {
  const { user, phone, lineID, error, success, isPending, setPhone, setLineID, handleSubmit } =
    useContactForm(initialUser, updateCurrentUser);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Profile</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">{user.name}</h1>
          <p className="mt-1 text-sm text-zinc-600">{user.email}</p>
        </div>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
          User #{user.user_id}
        </span>
      </div>

      <form className="mt-8" onSubmit={handleSubmit}>
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label
              className="text-xs font-medium uppercase tracking-wide text-zinc-500"
              htmlFor="profile-phone"
            >
              Phone
            </label>
            <Input
              id="profile-phone"
              className="mt-2"
              autoComplete="tel"
              maxLength={20}
              placeholder="Not provided"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              disabled={isPending}
            />
          </div>
          <div>
            <label
              className="text-xs font-medium uppercase tracking-wide text-zinc-500"
              htmlFor="profile-line-id"
            >
              LINE ID
            </label>
            <Input
              id="profile-line-id"
              className="mt-2"
              maxLength={50}
              placeholder="Not provided"
              value={lineID}
              onChange={(event) => setLineID(event.target.value)}
              disabled={isPending}
            />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Joined</p>
            <p className="mt-3 text-sm text-zinc-900">
              {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Both fields are optional. Your email remains available as a contact channel.
        </p>
        {error ? (
          <p className="mt-4 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="mt-4 text-sm text-green-700" role="status">
            {success}
          </p>
        ) : null}
        <Button className="mt-5" type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save contact information"}
        </Button>
      </form>
    </div>
  );
}
