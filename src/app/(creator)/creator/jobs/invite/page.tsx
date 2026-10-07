import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = { title: "Invite marketers to a job | CU Ways" };

type InviteStartPageProps = {
  searchParams: Promise<{ job_id?: string | string[]; edit?: string | string[] }>;
};

function parseJobId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id <= 2_147_483_647 ? id : null;
}

export default async function InviteStartPage({ searchParams }: InviteStartPageProps) {
  const { job_id: rawJobId, edit } = await searchParams;
  const isEditing = edit === "1";
  const jobId = typeof rawJobId === "string" ? parseJobId(rawJobId) : null;
  if (!isEditing && jobId !== null) redirect(`/creator/jobs/${jobId}/invite`);

  const hasInvalidInput = rawJobId !== undefined && jobId === null;
  return (
    <section className="mx-auto w-full max-w-5xl text-[var(--mk-text)]">
      <Link
        href="/creator/dashboard"
        aria-label="Back to Creator workspace"
        className="mb-5 inline-flex size-10 items-center justify-center rounded-full border border-[var(--mk-border)] bg-[var(--mk-surface)] text-[var(--mk-text)] shadow-[var(--mk-shadow)] outline-none hover:border-[var(--mk-accent)] focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowLeft aria-hidden="true" className="size-5" />
      </Link>
      <div className="mb-5 border-b border-[var(--mk-border)] pb-5">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--mk-text)]">Select a Job</h1>
        <p className="mt-1 text-sm text-[var(--mk-muted)]">
          Choose an existing job to send direct invitations to marketers.
        </p>
      </div>
      <section aria-labelledby="direct-invitations-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--mk-border)] pb-4 sm:pb-5">
          <div>
            <h2
              id="direct-invitations-heading"
              className="text-lg font-semibold text-[var(--mk-text)]"
            >
              Direct Invitations
            </h2>
            <p className="mt-1 text-sm text-[var(--mk-muted)]">
              Send a direct job request to selected marketers.
            </p>
          </div>
        </div>
        <Card className="mk-card mk-card-padding gap-5">
          <div className="flex size-12 items-center justify-center rounded-full bg-[var(--mk-accent-soft)] text-[var(--mk-accent)]">
            <BriefcaseBusiness aria-hidden="true" className="size-5" />
          </div>
          <p className="text-sm leading-6 text-[var(--mk-muted)]">
            Enter the ID of an existing job to open its invitation flow.
          </p>
          {hasInvalidInput ? (
            <p className="text-sm text-[var(--mk-error)]" role="alert">
              Enter a valid job ID to continue.
            </p>
          ) : null}
          <form action="/creator/jobs/invite" method="get" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="job-id">Job ID</Label>
              <Input
                id="job-id"
                name="job_id"
                type="number"
                min={1}
                max={2_147_483_647}
                step={1}
                required
                defaultValue={typeof rawJobId === "string" ? rawJobId : undefined}
                placeholder="Enter the job ID"
                className="mk-profile-input mt-0 w-full rounded-xl"
              />
            </div>
            <Button type="submit" className="mk-primary-button w-full justify-center font-semibold">
              <UserPlus aria-hidden="true" className="size-4" />
              Invite Marketers
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
          </form>
        </Card>
      </section>
    </section>
  );
}
