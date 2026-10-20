import Link from "next/link";
import { ApiError } from "@/lib/api/errors";
import { buttonVariants } from "@/components/ui/button";

export function SurveyReadError({ error }: { error: unknown }) {
  const expired = error instanceof ApiError && error.status === 401;
  const denied = error instanceof ApiError && [403, 404].includes(error.status);
  const message = expired
    ? "Your session expired. Sign in again to continue."
    : denied
      ? "This survey may not exist or may belong to another Creator."
      : "Your surveys could not be loaded. Please try again.";
  return (
    <section
      role="alert"
      className="space-y-4 rounded-2xl border border-[var(--mk-border)] bg-[var(--mk-surface)] p-6 text-[var(--mk-text)]"
    >
      <h1 className="text-xl font-semibold">Surveys unavailable</h1>
      <p>{message}</p>
      <Link
        href={expired ? "/login" : "/surveys"}
        className={buttonVariants({ variant: "outline" })}
      >
        {expired ? "Sign in again" : "Try My surveys again"}
      </Link>
    </section>
  );
}
