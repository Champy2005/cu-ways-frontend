"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { User } from "@/features/users/types";
import { deactivateUser } from "./user-actions";

export function AdminUserDetails({ user, canDeactivate }: { user: User; canDeactivate: boolean }) {
  const router = useRouter();
  const trigger = useRef<HTMLButtonElement>(null);
  const keep = useRef<HTMLButtonElement>(null);
  const busy = useRef(false);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deactivate() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError(null);
    try {
      const result = await deactivateUser(user.user_id);
      if (result) setError(result);
      else {
        router.replace("/admin/users");
        router.refresh();
      }
    } catch {
      setError("Deactivation could not be confirmed. Check the user list.");
    } finally {
      setPending(false);
      busy.current = false;
    }
  }

  return (
    <section className="space-y-4 text-zinc-950">
      <Link href="/admin/users" className="text-sm underline">
        Back to users
      </Link>
      <h1 className="text-2xl font-semibold">{user.name}</h1>
      <dl className="grid gap-3 sm:grid-cols-3">
        <div>
          <dt className="font-medium">Email</dt>
          <dd className="wrap-anywhere">{user.email}</dd>
        </div>
        <div>
          <dt className="font-medium">Phone</dt>
          <dd>{user.phone ?? "—"}</dd>
        </div>
        <div>
          <dt className="font-medium">LINE ID</dt>
          <dd className="wrap-anywhere">{user.line_id ?? "—"}</dd>
        </div>
      </dl>
      {canDeactivate && (
        <Button
          type="button"
          ref={trigger}
          variant="destructive"
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
        >
          Deactivate account
        </Button>
      )}
      <AlertDialog
        open={open}
        onOpenChange={(value) => {
          if (!pending) setOpen(value);
        }}
      >
        <AlertDialogContent initialFocus={keep} finalFocus={trigger}>
          <AlertDialogTitle>Deactivate this account?</AlertDialogTitle>
          <AlertDialogDescription>
            {user.name} will lose access immediately. Job history is retained.
          </AlertDialogDescription>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <AlertDialogCancel ref={keep} disabled={pending}>
              Keep account
            </AlertDialogCancel>
            <Button variant="destructive" disabled={pending} onClick={() => void deactivate()}>
              {pending ? "Deactivating…" : "Confirm deactivation"}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
