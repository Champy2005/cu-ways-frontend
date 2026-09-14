"use client";
import { useLogout } from "./use-logout";
export function LogoutButton() {
  const { logout, isPending, error } = useLogout();
  return (
    <>
      <button
        type="button"
        onClick={logout}
        disabled={isPending}
        className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 disabled:opacity-50"
      >
        {isPending ? "Signing out..." : "Sign out"}
      </button>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
