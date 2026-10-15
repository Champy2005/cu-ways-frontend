"use client";

import { type FormEvent, useRef, useState } from "react";

import { ApiError, getDisplayError } from "@/lib/api/errors";
import {
  formatPhone,
  lineIDValidationMessage,
  normalizeContactUpdate,
  phoneValidationMessage,
} from "@/features/users/schemas";
import type { ContactProfile, SaveContact } from "@/features/users/types";

/** What the banner over the card shows (US-003 frames "save changed" and "phone num taken"). */
export type ContactBanner = { kind: "saved" } | { kind: "failed"; message: string };

type FieldErrors = { phone?: string; line_id?: string };

/** Turns a failed save into the design's field error and banner. */
export function contactFailure(error: unknown): { fields: FieldErrors; banner: ContactBanner } {
  if (error instanceof ApiError && error.code === "phone_already_exists") {
    return {
      fields: { phone: "This phone number is already in use" },
      banner: { kind: "failed", message: "Please check your phone number." },
    };
  }
  return { fields: {}, banner: { kind: "failed", message: getDisplayError(error) } };
}

export function useContactSettings(initialUser: ContactProfile, save: SaveContact) {
  const [user, setUser] = useState(initialUser);
  const [phone, updatePhone] = useState(formatPhone(initialUser.phone));
  const [lineID, updateLineID] = useState(initialUser.line_id ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<ContactBanner | null>(null);
  const [isPending, setPending] = useState(false);
  const inFlight = useRef(false);

  function edit(field: keyof FieldErrors, value: string) {
    if (field === "phone") updatePhone(value);
    else updateLineID(value);
    setBanner(null);
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const input = normalizeContactUpdate({ phone, line_id: lineID });
    const fieldErrors: FieldErrors = {
      phone: phoneValidationMessage(phone) ?? undefined,
      line_id: lineIDValidationMessage(input.line_id) ?? undefined,
    };
    setErrors(fieldErrors);
    setBanner(null);
    if (fieldErrors.phone || fieldErrors.line_id) return;

    inFlight.current = true;
    setPending(true);
    try {
      const saved = await save(input);
      setUser(saved);
      updatePhone(formatPhone(saved.phone));
      updateLineID(saved.line_id ?? "");
      setBanner({ kind: "saved" });
    } catch (caught) {
      const failure = contactFailure(caught);
      setErrors(failure.fields);
      setBanner(failure.banner);
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return {
    user,
    phone,
    lineID,
    errors,
    banner,
    isPending,
    setPhone: (value: string) => edit("phone", value),
    setLineID: (value: string) => edit("line_id", value),
    handleSubmit,
  };
}
