"use client";

import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export type MarketerFailure =
  "unavailable" | "ineligible" | "forbidden" | "missing" | "unauthorized";

const messages: Record<MarketerFailure, { title: string; description: string }> = {
  unavailable: {
    title: "This page is temporarily unavailable",
    description: "We couldn’t load your marketer information. Please try again shortly.",
  },
  ineligible: {
    title: "A marketer profile is required",
    description: "Create your marketer profile to start offering services.",
  },
  forbidden: {
    title: "You don’t have access",
    description: "You can manage only your own profile and service packages.",
  },
  missing: {
    title: "Marketer not found",
    description:
      "This marketer’s service catalog is no longer available. Check the link and try again.",
  },
  unauthorized: {
    title: "Please sign in again",
    description: "Your session is no longer available. Sign in to continue.",
  },
};

export function RouteFeedback({ kind = "unavailable" }: { kind?: MarketerFailure }) {
  const router = useRouter();
  const message = messages[kind];
  return (
    <section
      className="mx-auto my-12 max-w-lg rounded-3xl border border-[var(--mk-border)] bg-[var(--mk-surface)] p-7"
      aria-labelledby="feedback-title"
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--mk-muted)]">
        CU Ways
      </p>
      <h1 id="feedback-title" className="text-2xl font-semibold">
        {message.title}
      </h1>
      <p className="mt-3 text-sm leading-6 text-[var(--mk-muted)]" role="status">
        {message.description}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-5">
        {kind === "ineligible" && (
          <Link className="mk-button px-5 py-2" href="/marketer/profile">
            Create marketer profile
          </Link>
        )}
        {kind === "unavailable" && (
          <Button className="mk-button px-5" onClick={() => router.refresh()}>
            Try again
          </Button>
        )}
        <Link
          className="text-sm underline underline-offset-4"
          href={kind === "unauthorized" ? "/login" : "/dashboard"}
        >
          {kind === "unauthorized" ? "Sign in" : "Back to workspace"}
        </Link>
      </div>
    </section>
  );
}

export function MarketerLoading() {
  return (
    <div className="space-y-5 py-7" role="status" aria-label="Loading marketer information">
      <span className="text-sm text-[var(--mk-muted)]">Loading your workspace…</span>
      {["h-32", "h-24", "h-24"].map((height, index) => (
        <Skeleton
          key={index}
          className={`${height} animate-pulse rounded-3xl bg-[var(--mk-border)] motion-reduce:animate-none`}
        />
      ))}
    </div>
  );
}
