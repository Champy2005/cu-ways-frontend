"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function InvitationFailure({ message, status }: { message: string; status?: number }) {
  const router = useRouter();
  return (
    <section className="ji-page space-y-4">
      <h1>Invitations unavailable</h1>
      <p role="alert">{message}</p>
      {status === 401 ? (
        <Link href="/login" className="ji-accent underline">
          Sign in
        </Link>
      ) : (
        <>
          <Button onClick={() => router.refresh()}>Try again</Button>
          <Link href="/marketer/invitations" className="ml-4 ji-accent underline">
            Back to invitations
          </Link>
        </>
      )}
      {status === 403 && (
        <Link href="/marketer/profile" className="block ji-accent underline">
          Open marketer profile
        </Link>
      )}
    </section>
  );
}
