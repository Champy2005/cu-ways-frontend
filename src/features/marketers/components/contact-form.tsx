"use client";

import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { useContactForm } from "@/features/users/use-contact-form";
import type { ContactProfile, SaveContact } from "@/features/users/types";

export function ContactForm({ contact, onSave }: { contact: ContactProfile; onSave: SaveContact }) {
  const form = useContactForm(contact, onSave);
  const id = useId();
  return (
    <form onSubmit={form.handleSubmit} noValidate className="flex flex-col">
      <dl className="mk-contact-details">
        <div>
          <dt className="mk-profile-label">Name</dt>
          <dd className="mt-2 text-base wrap-anywhere">{form.user.name}</dd>
        </div>
        <div>
          <dt className="mk-profile-label">Email</dt>
          <dd className="mt-2 text-base wrap-anywhere">{form.user.email}</dd>
        </div>
      </dl>
      <fieldset disabled={form.isPending} className="grid gap-6 sm:grid-cols-2">
        <legend className="sr-only">Contact information</legend>
        <Field>
          <FieldLabel htmlFor={`${id}-phone`} className="mk-profile-label">
            Phone number <span aria-hidden="true">*</span>
          </FieldLabel>
          <Input
            id={`${id}-phone`}
            className="mk-profile-input"
            required
            autoComplete="tel"
            inputMode="tel"
            maxLength={20}
            placeholder="Not specified"
            value={form.phone}
            onChange={(e) => form.setPhone(e.target.value)}
            aria-describedby={`${id}-help ${form.error ? `${id}-error` : ""}`}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-line`} className="mk-profile-label">
            LINE ID
          </FieldLabel>
          <Input
            id={`${id}-line`}
            className="mk-profile-input"
            maxLength={50}
            placeholder="Not specified"
            value={form.lineID}
            onChange={(e) => form.setLineID(e.target.value)}
            aria-describedby={`${id}-help ${form.error ? `${id}-error` : ""}`}
          />
        </Field>
      </fieldset>
      <FieldDescription id={`${id}-help`} className="mt-4 text-sm">
        Phone number is required. LINE ID is optional.
      </FieldDescription>
      <p className="mt-5 text-sm text-[var(--mk-muted)]">
        Joined{" "}
        {new Date(form.user.created_at).toLocaleDateString("en-GB", {
          dateStyle: "long",
          timeZone: "UTC",
        })}
      </p>
      <div aria-live="polite" className="mt-5 min-h-6">
        {form.error && (
          <FieldError id={`${id}-error`}>
            {form.error} Your changes are still here. Please try saving again.
          </FieldError>
        )}
        {form.success && (
          <p role="status" className="text-sm text-[var(--mk-success)]">
            {form.success}
          </p>
        )}
      </div>
      <Button
        type="submit"
        disabled={form.isPending}
        className="mk-primary-button mk-profile-submit"
      >
        {form.isPending ? "Saving…" : "Save contact information"}
      </Button>
    </form>
  );
}
