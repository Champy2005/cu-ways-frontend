"use client";

import { type FormEvent, useRef, useState } from "react";

import { register } from "@/features/auth/api";
import type { RoleChoice } from "@/features/auth/components/register/account-step";
import {
  EMPTY_REGISTRATION,
  accountStepErrors,
  contactStepErrors,
  experienceStepErrors,
  registrationPayload,
  type RegistrationErrors,
  type RegistrationFields,
  type RegistrationRole,
} from "@/features/auth/schemas";
import { ApiError, getDisplayError } from "@/lib/api/errors";

export type FormStep = "account" | "contact" | "experience";
export type Step = FormStep | "done";
export type Banner = { detail?: string };

const VALIDATORS: Record<FormStep, (input: RegistrationFields) => RegistrationErrors> = {
  account: accountStepErrors,
  contact: contactStepErrors,
  experience: experienceStepErrors,
};

/** The account is created once, on the last step: step 2 for creators, step 3 for marketers. */
export function isFinalStep(step: FormStep, role: RegistrationRole): boolean {
  return step === "experience" || (step === "contact" && role !== "marketer");
}

export function nextStep(step: FormStep): FormStep {
  return step === "account" ? "contact" : "experience";
}

export function previousStep(step: FormStep): FormStep | null {
  if (step === "contact") return "account";
  if (step === "experience") return "contact";
  return null;
}

export function primaryAction(
  step: FormStep,
  role: RegistrationRole,
): { label: string; tone: "default" | "creator" | "marketer" } {
  if (step === "experience") return { label: "Confirm", tone: "marketer" };
  if (step === "contact" && role !== "marketer") return { label: "Confirm", tone: "creator" };
  return { label: "Next", tone: "default" };
}

/** Where a failed sign-up sends the user, and what it shows there. */
export function failureFor(error: unknown): {
  step?: FormStep;
  errors: RegistrationErrors;
  banner: Banner;
} {
  if (error instanceof ApiError && error.code === "email_already_exists") {
    return { step: "account", errors: { email: "This email is already registered." }, banner: {} };
  }
  if (error instanceof ApiError && error.code === "phone_already_exists") {
    return {
      step: "contact",
      errors: { phone: "This phone number is already registered." },
      banner: {},
    };
  }
  return { errors: {}, banner: { detail: getDisplayError(error) } };
}

function without(errors: RegistrationErrors, key: keyof RegistrationFields): RegistrationErrors {
  if (!(key in errors)) return errors;
  const next = { ...errors };
  delete next[key];
  return next;
}

export function useRegisterWizard() {
  const [values, setValues] = useState<RegistrationFields>(EMPTY_REGISTRATION);
  const [choice, setChoice] = useState<RoleChoice | null>(null);
  const [step, setStep] = useState<Step>("account");
  const [attempted, setAttempted] = useState<Set<FormStep>>(new Set());
  const [serverErrors, setServerErrors] = useState<RegistrationErrors>({});
  const [banner, setBanner] = useState<Banner | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const role: RegistrationRole = values.role ?? "creator";
  const clientErrors = step !== "done" && attempted.has(step) ? VALIDATORS[step](values) : {};
  const errors: RegistrationErrors = { ...clientErrors, ...serverErrors };

  function change<K extends keyof RegistrationFields>(key: K, value: RegistrationFields[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setBanner(null);
    setServerErrors((current) => without(current, key));
  }

  function choose(next: RoleChoice) {
    setChoice(next);
    // "I'm not sure" registers as a Creator; the role can be changed later.
    change("role", next === "marketer" ? "marketer" : "creator");
  }

  async function submit() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await register(registrationPayload(values));
      setStep("done");
    } catch (error) {
      const failure = failureFor(error);
      setServerErrors(failure.errors);
      setBanner(failure.banner);
      if (failure.step) setStep(failure.step);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === "done") return;
    if (Object.keys(VALIDATORS[step](values)).length > 0) {
      setAttempted((current) => new Set(current).add(step));
      return;
    }
    if (isFinalStep(step, role)) {
      void submit();
      return;
    }
    setStep(nextStep(step));
  }

  function goBack() {
    if (step === "done") return;
    const previous = previousStep(step);
    if (previous) setStep(previous);
  }

  return {
    values,
    choice,
    step,
    role,
    errors,
    // As designed, the primary button greys out while the step shows errors.
    blocked: Object.keys(errors).length > 0,
    banner,
    submitting,
    change,
    choose,
    handleSubmit,
    goBack,
  };
}
