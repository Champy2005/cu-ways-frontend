"use client";

import { SuccessToast } from "@/components/feedback/success-toast";

import type { ComponentType, ReactNode } from "react";
import Image from "next/image";
import { Mail, MessageCircle, Phone } from "lucide-react";

import { MarketerPageHeader } from "@/features/marketer-discovery/components/marketer-page-header";

import { updateCurrentUser } from "@/features/users/browser-api";
import type { ContactProfile } from "@/features/users/types";
import { type ContactBanner, useContactSettings } from "@/features/users/use-contact-settings";
import { cn } from "@/lib/utils";

import "@/features/users/contact-settings.css";

type IconProps = { className?: string; strokeWidth?: number; "aria-hidden"?: boolean };

/** Banner over the top edge of the card (save changed 508:3513, phone num taken 511:3957). */
function Banner({ banner }: { banner: ContactBanner }) {
  if (banner.kind === "saved") {
    return <SuccessToast message="Your contact info has been updated" />;
  }
  return (
    <div
      role="alert"
      className="absolute top-0 left-[8px] flex min-h-[44px] w-[290px] items-center gap-[8px] rounded-[10px] border border-[var(--cs-failed-border)] bg-[var(--cs-failed-fill)] py-[6px] pl-[18px] text-[var(--cs-failed-text)]"
    >
      <span
        aria-hidden="true"
        className="grid size-[18px] shrink-0 place-items-center rounded-full bg-[var(--cs-failed-icon)] text-[12px] leading-none font-bold text-white"
      >
        !
      </span>
      <span className="leading-[15px]">
        <span className="block text-[14px] font-semibold">Couldn’t save changes.</span>
        <span className="block text-[12px]">{banner.message}</span>
      </span>
    </div>
  );
}

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  icon: ComponentType<IconProps>;
  className?: string;
  children: ReactNode;
};

/** Label (Inter Semi Bold 12) over a 250px input with a left icon; error right-aligned below. */
function Field({ id, label, hint, error, icon: Icon, className, children }: FieldProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <div className="mb-px flex items-baseline justify-between">
        <label htmlFor={id} className="text-[12px] leading-[15px] font-semibold">
          {label}
        </label>
        {hint && (
          <span className="text-[11px] leading-[15px] text-[var(--cs-placeholder)]">{hint}</span>
        )}
      </div>
      <div className="relative">
        <Icon
          className={cn(
            "pointer-events-none absolute top-1/2 left-[12px] size-[16px] -translate-y-1/2",
            error ? "text-[var(--cs-error-icon)]" : "text-[var(--cs-icon)]",
          )}
          strokeWidth={1.5}
          aria-hidden={true}
        />
        {children}
      </div>
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="absolute top-full right-0 text-right text-[10px] leading-[12px] text-[var(--cs-error)]"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Settings > Contact Information (US-003). Email is fixed; phone is required and
 * must be 10 digits; LINE ID is optional.
 */
export function ContactSettings({ user: initialUser }: { user: ContactProfile }) {
  const form = useContactSettings(initialUser, updateCurrentUser);

  return (
    <section className="contact-settings relative mx-auto w-full max-w-md pb-10">
      <MarketerPageHeader
        title="Settings"
        subtitle="Contact Information"
        backHref="/creator/dashboard"
        backLabel="Back to overview"
      />

      <form
        noValidate
        onSubmit={form.handleSubmit}
        aria-labelledby="contact-settings-title"
        className="contact-settings-card relative z-10 mx-auto mt-[43px] w-full max-w-md p-5"
      >
        {form.banner && <Banner banner={form.banner} />}
        <h2
          id="contact-settings-title"
          className="-ml-[3px] text-[16px] leading-[19px] font-medium"
        >
          Contact Information
        </h2>
        <p className="ml-[2px] text-[12px] leading-[1.35] text-[var(--cs-ink-60)]">
          How others can reach you
        </p>

        <fieldset disabled={form.isPending} className="contents">
          <Field id="contact-email" label="Email" icon={Mail} className="mt-[13px]">
            <input
              id="contact-email"
              type="email"
              value={form.user.email}
              readOnly
              aria-describedby="contact-email-help"
              className="contact-settings-input"
            />
          </Field>
          <p
            id="contact-email-help"
            className="mt-px w-[250px] text-center text-[10px] leading-[1.35] text-[var(--cs-placeholder)]"
          >
            This is the email you signed up with
          </p>

          <Field
            id="contact-phone"
            label="Phone number"
            error={form.errors.phone}
            icon={Phone}
            className="mt-[12px]"
          >
            <input
              id="contact-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Enter phone number"
              required
              maxLength={20}
              value={form.phone}
              onChange={(event) => form.setPhone(event.target.value)}
              aria-invalid={Boolean(form.errors.phone)}
              aria-describedby={form.errors.phone ? "contact-phone-error" : undefined}
              className="contact-settings-input"
            />
          </Field>

          <Field
            id="contact-line"
            label="Line ID"
            hint="Optional"
            error={form.errors.line_id}
            icon={MessageCircle}
            className="mt-[17px]"
          >
            <input
              id="contact-line"
              autoComplete="off"
              placeholder="Enter your Line ID"
              maxLength={50}
              value={form.lineID}
              onChange={(event) => form.setLineID(event.target.value)}
              aria-invalid={Boolean(form.errors.line_id)}
              aria-describedby={form.errors.line_id ? "contact-line-error" : undefined}
              className="contact-settings-input"
            />
          </Field>
        </fieldset>

        <button
          type="submit"
          disabled={form.isPending}
          aria-busy={form.isPending}
          className="contact-settings-save mt-[17px]"
        >
          {form.isPending ? "Saving…" : "Save changes"}
        </button>
      </form>

      {/* The design's pink bird, cropped by the screen's bottom-right corner. */}
      <Image
        src="/register/success-creator.svg"
        width={204}
        height={194.061}
        alt=""
        aria-hidden
        className="pointer-events-none fixed right-[-31px] bottom-[-52px] z-0 -scale-x-100 select-none"
      />
    </section>
  );
}
