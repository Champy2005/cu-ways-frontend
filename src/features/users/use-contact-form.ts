"use client";

import { useRef, useState, type FormEvent } from "react";
import { ApiError, getDisplayError } from "@/lib/api/errors";
import { contactValidationMessage, normalizeContactUpdate } from "./schemas";
import type { ContactProfile, SaveContact } from "./types";

export function useContactForm(initialUser: ContactProfile, save: SaveContact) {
  const [user, setUser] = useState(initialUser);
  const [phone, updatePhone] = useState(initialUser.phone ?? "");
  const [lineID, updateLineID] = useState(initialUser.line_id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, setPending] = useState(false);
  const inFlight = useRef(false);
  function setPhone(value: string) {
    updatePhone(value);
    setPhoneError(null);
    setError(null);
    setSuccess(null);
  }
  function setLineID(value: string) {
    updateLineID(value);
    setError(null);
    setSuccess(null);
  }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    setSuccess(null);
    setPhoneError(null);
    setError(null);
    const input = normalizeContactUpdate({ phone, line_id: lineID });
    const validationError = contactValidationMessage(input);
    if (validationError) {
      if (validationError.includes("Phone")) {
        setPhoneError(validationError);
      } else {
        setError(validationError);
      }
      return;
    }
    inFlight.current = true;
    setPending(true);
    try {
      const saved = await save(input);
      setUser(saved);
      updatePhone(saved.phone ?? "");
      updateLineID(saved.line_id ?? "");
      setSuccess("Contact information saved.");
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === "phone_already_exists") {
        setPhoneError("Phone number is already registered.");
      } else {
        setError(getDisplayError(caught));
      }
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }
  return {
    user,
    phone,
    lineID,
    error,
    phoneError,
    success,
    isPending,
    setPhone,
    setLineID,
    handleSubmit,
  };
}
