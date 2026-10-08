import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export function InvitationsUnavailable({ offer = false }: { offer?: boolean }) {
  return (
    <Card className="mx-auto my-12 max-w-lg border-[var(--mk-border)] bg-[var(--mk-surface)] text-[var(--mk-text)]">
      <CardContent className="space-y-4 p-7">
        <p className="text-xs font-semibold tracking-widest text-[var(--mk-muted)] uppercase">
          CU Ways
        </p>
        <h1 className="text-2xl font-semibold">
          {offer
            ? "Offer submission is not available yet"
            : "Direct invitations are not available yet"}
        </h1>
        <p className="text-sm leading-6 text-[var(--mk-muted)]" role="status">
          {offer
            ? "You’ll be able to send a custom price offer after accepting an invitation once this service is available."
            : "Received invitations and response actions will appear here once this service is available."}
        </p>
        <Link
          href="/marketer/dashboard"
          className="inline-block text-sm underline underline-offset-4"
        >
          Back to marketer overview
        </Link>
      </CardContent>
    </Card>
  );
}
