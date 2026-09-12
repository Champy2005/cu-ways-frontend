"use client";

import { useId, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { FieldLabel, FieldError as FormFieldError } from "@/components/ui/field";
import {
  useProfessionalProfile,
  type ProfileFormProps,
} from "@/features/marketers/components/profile-form-state";

const fieldClassName = "mk-profile-input";

function FieldError({ id, error }: { id: string; error?: string }) {
  return error ? (
    <FormFieldError id={id} className="mt-2 text-[var(--mk-error)]">
      {error}
    </FormFieldError>
  ) : null;
}
export function ProfileForm(props: ProfileFormProps) {
  const form = useProfessionalProfile(props);
  const id = useId();
  const portal = useRef<HTMLDivElement>(null);
  return (
    <form onSubmit={form.submit} noValidate className="mk-profile-form">
      <p className="mb-5 text-sm text-[var(--mk-muted)]">
        Complete the required fields (*) to help creators get to know your work.
      </p>
      <fieldset disabled={form.pending} className="mk-profile-fields">
        <legend className="sr-only">Professional information</legend>
        <div className="mk-profile-field mk-profile-bio">
          <FieldLabel htmlFor={`${id}-bio`} className="mk-profile-label">
            Bio <span aria-hidden="true">*</span>
          </FieldLabel>
          <Textarea
            id={`${id}-bio`}
            required
            maxLength={5000}
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
          <FieldLabel htmlFor={`${id}-experience`} className="mk-profile-label">
            Years of experience <span aria-hidden="true">*</span>
          </FieldLabel>
          <Input
            id={`${id}-experience`}
            name="experience_years"
            required
            inputMode="numeric"
            placeholder="Not specified"
            className={fieldClassName}
            value={form.values.experience_years}
            onChange={(event) => form.change("experience_years", event.target.value)}
            aria-invalid={Boolean(form.errors.experience_years)}
            aria-describedby={`${id}-experience-help${form.errors.experience_years ? ` ${id}-experience-error` : ""}`}
          />
          <p id={`${id}-experience-help`} className="mt-2 text-sm text-[var(--mk-muted)]">
            Enter a whole number from 0 to 80.
          </p>
          <FieldError id={`${id}-experience-error`} error={form.errors.experience_years} />
        </div>
        <div className="mk-profile-field">
          <FieldLabel htmlFor={`${id}-availability`} className="mk-profile-label">
            Availability text <span aria-hidden="true">*</span>
          </FieldLabel>
          <Textarea
            id={`${id}-availability`}
            required
            maxLength={5000}
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
        <div className="mk-profile-field">
          <FieldLabel htmlFor={`${id}-status`} className="mk-profile-label">
            Availability status <span aria-hidden="true">*</span>
          </FieldLabel>
          <Select
            items={[
              { value: "available", label: "Available" },
              { value: "limited", label: "Limited availability" },
              { value: "unavailable", label: "Unavailable" },
            ]}
            name="availability_status"
            required
            disabled={form.pending}
            modal={false}
            value={form.values.availability_status}
            onValueChange={(value) => {
              if (value) form.change("availability_status", value);
            }}
          >
            <SelectTrigger
              id={`${id}-status`}
              className="mk-profile-input w-full"
              aria-invalid={Boolean(form.errors.availability_status)}
              aria-describedby={form.errors.availability_status ? `${id}-status-error` : undefined}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              container={portal}
              align="start"
              alignItemWithTrigger={false}
              className="mk-select-content"
            >
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="limited">Limited availability</SelectItem>
              <SelectItem value="unavailable">Unavailable</SelectItem>
            </SelectContent>
          </Select>
          <div ref={portal} />
          <FieldError id={`${id}-status-error`} error={form.errors.availability_status} />
        </div>
      </fieldset>

      <div aria-live="polite" className="mt-5 min-h-6 text-sm">
        {form.requestError ? (
          <p role="alert" className="text-[var(--mk-error,#b42318)]">
            {form.requestError} Your changes are still here. Please try saving again.
          </p>
        ) : null}
        {form.success ? (
          <p role="status" className="text-[var(--mk-accent)]">
            Professional information saved.
          </p>
        ) : null}
      </div>
      <Button type="submit" disabled={form.pending} className="mk-primary-button mk-profile-submit">
        {form.pending ? "Saving changes…" : "Confirm changes"}
      </Button>
    </form>
  );
}
