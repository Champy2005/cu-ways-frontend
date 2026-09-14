"use client";

import { useRef, useState, type FormEvent } from "react";
import { getDisplayError } from "@/lib/api/errors";
import { contactValidationMessage, normalizeContactUpdate } from "./schemas";
import type { ContactProfile, SaveContact } from "./types";

export function useContactForm(initialUser: ContactProfile, save: SaveContact) {
  const [user, setUser] = useState(initialUser);
  const [phone, updatePhone] = useState(initialUser.phone ?? "");
  const [lineID, updateLineID] = useState(initialUser.line_id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, setPending] = useState(false);
  const inFlight = useRef(false);
  function setPhone(value: string) {
    updatePhone(value);
    setSuccess(null);
  }
  function setLineID(value: string) {
    updateLineID(value);
    setSuccess(null);
  }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    setSuccess(null);
    const input = normalizeContactUpdate({ phone, line_id: lineID });
    const validationError = contactValidationMessage(input);
    setError(validationError);
    if (validationError) return;
    inFlight.current = true;
    setPending(true);
    try {
      const saved = await save(input);
      setUser(saved);
      updatePhone(saved.phone ?? "");
      updateLineID(saved.line_id ?? "");
      setSuccess("Contact information saved.");
    } catch (caught) {
      setError(getDisplayError(caught));
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }
  return { user, phone, lineID, error, success, isPending, setPhone, setLineID, handleSubmit };
}
