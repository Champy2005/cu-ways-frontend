"use client";

import { useRef, useState, type FormEvent } from "react";

import { ApiError, getDisplayError } from "@/lib/api/errors";
import { isRecord } from "@/lib/api/envelope";
import { parseProfileForm } from "@/features/marketers/schemas";
import type { MarketerProfile, ProfileInput } from "@/features/marketers/types";

type ProfileFields = Record<keyof ProfileInput, string>;
export type ProfileFieldErrors = Partial<Record<keyof ProfileInput, string>>;

export type ProfileFormProps = {
  profile: MarketerProfile;
  onSave: (input: ProfileInput) => Promise<MarketerProfile>;
  onProfileChange?: (profile: MarketerProfile) => void;
  basicInfoHref?: string;
};

function profileFields(profile: MarketerProfile): ProfileFields {
  return {
    bio: profile.bio ?? "",
    experience_years: profile.experience_years?.toString() ?? "",
    availability_text: profile.availability_text ?? "",
  };
}

function profileFieldErrors(error: unknown): ProfileFieldErrors {
  if (!(error instanceof ApiError) || !isRecord(error.details)) return {};
  const errors: ProfileFieldErrors = {};
  const fields: (keyof ProfileInput)[] = ["bio", "experience_years", "availability_text"];
  for (const field of fields) {
    const message = error.details[field];
    if (typeof message === "string") errors[field] = message;
  }
  return errors;
}

export function useProfessionalProfile({ profile, onSave, onProfileChange }: ProfileFormProps) {
  const [values, setValues] = useState(() => profileFields(profile));
  const [errors, setErrors] = useState<ProfileFieldErrors>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);

  function change(field: keyof ProfileInput, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setSuccess(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    setSuccess(false);
    setRequestError(null);
    const result = parseProfileForm(values);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    submitting.current = true;
    setPending(true);
    setErrors({});
    try {
      const savedProfile = await onSave(result.data);
      setValues(profileFields(savedProfile));
      onProfileChange?.(savedProfile);
      setSuccess(true);
    } catch (error) {
      setRequestError(getDisplayError(error));
      setErrors(profileFieldErrors(error));
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return { values, errors, requestError, success, pending, change, submit };
}
