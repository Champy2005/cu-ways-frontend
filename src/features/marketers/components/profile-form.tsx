"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MarketerAvatar } from "@/features/marketers/components/marketer-identity";
import {
  useProfessionalProfile,
  type ProfileFormProps,
} from "@/features/marketers/components/profile-form-state";

const fieldClassName = "mk-profile-input";

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} role="alert" className="mt-2 text-sm text-[var(--mk-error,#b42318)]">
      {error}
    </p>
  );
}

export function ProfileForm(props: ProfileFormProps) {
  const { profile, basicInfoHref = "/profile" } = props;
  const form = useProfessionalProfile(props);
  const id = useId();

  return (
    <section className="text-[var(--mk-text)]">
      <div className="mk-page-heading">
        <p className="mk-eyebrow">Your professional workspace</p>
        <h1 className="mk-page-title">Profile settings</h1>
        <p className="mk-page-description">Change your professional information.</p>
      </div>
      <div className="mk-profile-layout">
        <aside className="mk-card mk-profile-summary" aria-label="Profile identity">
          <MarketerAvatar name={profile.name} className="size-[98px] text-4xl" />
          <div className="min-w-0 max-w-full">
            <p className="text-lg font-semibold wrap-anywhere">{profile.name}</p>
            <p className="mt-1 text-sm text-[var(--mk-info)]">Survey Marketer</p>
          </div>
          <p className="mk-profile-summary-description mt-2 max-w-[30ch] border-t border-[var(--mk-border)] pt-5 text-sm leading-6 text-[var(--mk-muted)]">
            Help creators get to know your experience and when you are available to work.
          </p>
        </aside>
        <div className="mk-card mk-profile-editor">
          <nav aria-label="Profile information" className="mk-profile-tabs">
            <Link
              href={basicInfoHref}
              className="flex min-h-11 items-center justify-center rounded-t-md border-b border-transparent px-1 py-2 text-sm font-medium text-[var(--mk-muted)] transition-colors hover:text-[var(--mk-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mk-profile-accent)] sm:text-base"
            >
              Basic information
            </Link>
            <span
              aria-current="page"
              className="flex min-h-11 items-center justify-center border-b border-[var(--mk-profile-accent)] px-1 py-2 text-sm font-medium text-[var(--mk-profile-accent)] sm:text-base"
            >
              In-depth information
            </span>
          </nav>

          <UserRound
            aria-hidden="true"
            strokeWidth={4}
            className="pointer-events-none absolute -right-16 bottom-0 -z-10 h-[390px] w-[300px] text-[var(--mk-text)] opacity-[0.04]"
          />
          <form onSubmit={form.submit} noValidate className="mk-profile-form">
            <p className="mb-5 text-xs text-[var(--mk-muted)]">
              All fields are optional. Add details that help creators get to know your work.
            </p>
            <fieldset disabled={form.pending} className="mk-profile-fields">
              <legend className="sr-only">Professional information</legend>
              <div className="mk-profile-field mk-profile-bio">
                <label htmlFor={`${id}-bio`} className="text-[13px] text-[var(--mk-muted)]">
                  Bio
                </label>
                <Textarea
                  id={`${id}-bio`}
                  name="bio"
                  rows={4}
                  placeholder="Not specified"
                  className={fieldClassName}
                  value={form.values.bio}
                  onChange={(event) => form.change("bio", event.target.value)}
                  aria-invalid={Boolean(form.errors.bio)}
                  aria-describedby={form.errors.bio ? `${id}-bio-error` : undefined}
                />
                <FieldError id={`${id}-bio-error`} error={form.errors.bio} />
              </div>
              <div className="mk-profile-field">
                <label htmlFor={`${id}-experience`} className="text-[13px] text-[var(--mk-muted)]">
                  Years of experience
                </label>
                <Input
                  id={`${id}-experience`}
                  name="experience_years"
                  inputMode="decimal"
                  placeholder="Not specified"
                  className={fieldClassName}
                  value={form.values.experience_years}
                  onChange={(event) => form.change("experience_years", event.target.value)}
                  aria-invalid={Boolean(form.errors.experience_years)}
                  aria-describedby={`${id}-experience-help${form.errors.experience_years ? ` ${id}-experience-error` : ""}`}
                />
                <p id={`${id}-experience-help`} className="mt-2 text-xs text-[var(--mk-muted)]">
                  Enter a number of years, such as 2 or 0.5.
                </p>
                <FieldError id={`${id}-experience-error`} error={form.errors.experience_years} />
              </div>
              <div className="mk-profile-field">
                <label
                  htmlFor={`${id}-availability`}
                  className="text-[13px] text-[var(--mk-muted)]"
                >
                  Availability text
                </label>
                <Textarea
                  id={`${id}-availability`}
                  name="availability_text"
                  rows={2}
                  placeholder="Not specified"
                  className={fieldClassName}
                  value={form.values.availability_text}
                  onChange={(event) => form.change("availability_text", event.target.value)}
                  aria-invalid={Boolean(form.errors.availability_text)}
                  aria-describedby={
                    form.errors.availability_text ? `${id}-availability-error` : undefined
                  }
                />
                <FieldError id={`${id}-availability-error`} error={form.errors.availability_text} />
              </div>
            </fieldset>

            <div aria-live="polite" className="mt-5 min-h-6 text-sm">
              {form.requestError ? (
                <p role="alert" className="text-[var(--mk-error,#b42318)]">
                  {form.requestError} Your changes are still here. Please try saving again.
                </p>
              ) : null}
              {form.success ? (
                <p role="status" className="text-[var(--mk-profile-accent)]">
                  Professional information saved.
                </p>
              ) : null}
            </div>
            <Button
              type="submit"
              disabled={form.pending}
              className="mk-primary-button mk-profile-submit"
            >
              {form.pending ? "Saving changes…" : "Confirm changes"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
