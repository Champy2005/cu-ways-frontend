"use client";

import { type FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDisplayError } from "@/lib/api/errors";
import { register } from "@/features/auth/api";
import {
  registrationFieldErrors,
  registrationPayload,
  type RegistrationFields,
} from "@/features/auth/schemas";

const fields = [
  {
    key: "first_name",
    label: "First name",
    autoComplete: "given-name",
    type: "text",
    required: true,
    maxLength: 100,
  },
  {
    key: "last_name",
    label: "Last name",
    autoComplete: "family-name",
    type: "text",
    required: true,
    maxLength: 100,
  },
  {
    key: "email",
    label: "Email",
    autoComplete: "email",
    type: "email",
    required: true,
    maxLength: 255,
  },
  {
    key: "phone",
    label: "Phone number",
    autoComplete: "tel",
    type: "tel",
    required: true,
    maxLength: 20,
  },
  {
    key: "password",
    label: "Password",
    autoComplete: "new-password",
    type: "password",
    required: true,
    maxLength: 128,
  },
  {
    key: "line_id",
    label: "LINE ID (optional)",
    autoComplete: "off",
    type: "text",
    required: false,
    maxLength: 50,
  },
] as const;

export function RegisterForm() {
  const router = useRouter();
  const [values, setValues] = useState<RegistrationFields>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    line_id: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegistrationFields, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const submitting = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const fieldErrors = registrationFieldErrors(values);
    setErrors(fieldErrors);
    setError(null);
    if (Object.keys(fieldErrors).length) return;
    submitting.current = true;
    setIsPending(true);
    try {
      await register(registrationPayload(values));
      router.push("/dashboard");
      router.refresh();
    } catch (requestError) {
      setError(getDisplayError(requestError));
    } finally {
      submitting.current = false;
      setIsPending(false);
    }
  }
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <p className="text-sm text-zinc-600">Required fields are marked with *.</p>
      <fieldset disabled={isPending} className="grid gap-5 sm:grid-cols-2">
        <legend className="sr-only">Create your account</legend>
        {fields.map(({ key, label, ...attributes }) => (
          <div key={key}>
            <label
              className="mb-2 block text-sm font-medium text-zinc-800"
              htmlFor={`register-${key}`}
            >
              {label}
              {attributes.required && <span aria-hidden="true"> *</span>}
            </label>
            <Input
              id={`register-${key}`}
              name={key}
              {...attributes}
              value={values[key]}
              onChange={(event) =>
                setValues((current) => ({ ...current, [key]: event.target.value }))
              }
              aria-invalid={Boolean(errors[key])}
              aria-describedby={errors[key] ? `register-${key}-error` : undefined}
            />
            {errors[key] && (
              <p id={`register-${key}-error`} role="alert" className="mt-1 text-sm text-red-700">
                {errors[key]}
              </p>
            )}
          </div>
        ))}
      </fieldset>
      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={isPending} size="lg">
        {isPending ? "Creating account..." : "Create account"}
      </Button>
      <p className="text-center text-sm text-zinc-600">
        Already registered?{" "}
        <Link className="font-medium text-zinc-950 underline" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}
