"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDisplayError } from "@/lib/api/errors";
import { register } from "@/features/auth/api";
import {
  normalizeRegisterInput,
  registerValidationMessage,
} from "@/features/auth/schemas";
import type { RegisterRequest } from "@/features/auth/types";

export function RegisterForm() {
  const router = useRouter();
  const [values, setValues] = useState<RegisterRequest>({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function update(field: keyof RegisterRequest, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedValues = normalizeRegisterInput(values);
    const validationError = registerValidationMessage(normalizedValues);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsPending(true);
    setError(null);
    try {
      await register(normalizedValues);
      router.push("/dashboard");
      router.refresh();
    } catch (requestError) {
      setError(getDisplayError(requestError));
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-800" htmlFor="register-name">Name</label>
        <Input id="register-name" value={values.name} onChange={(event) => update("name", event.target.value)} required />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-800" htmlFor="register-email">Email</label>
        <Input id="register-email" type="email" autoComplete="email" value={values.email} onChange={(event) => update("email", event.target.value)} required />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-800" htmlFor="register-password">Password</label>
        <Input id="register-password" type="password" autoComplete="new-password" value={values.password} onChange={(event) => update("password", event.target.value)} required />
        <p className="mt-1 text-xs text-zinc-500">Use 8–128 characters.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-800" htmlFor="register-phone">Phone <span className="font-normal text-zinc-500">(optional)</span></label>
          <Input id="register-phone" value={values.phone ?? ""} onChange={(event) => update("phone", event.target.value)} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-800" htmlFor="register-line-id">Line ID <span className="font-normal text-zinc-500">(optional)</span></label>
          <Input id="register-line-id" value={values.line_id ?? ""} onChange={(event) => update("line_id", event.target.value)} />
        </div>
      </div>
      {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={isPending} size="lg">
        {isPending ? "Creating account..." : "Create account"}
      </Button>
      <p className="text-center text-sm text-zinc-600">
        Already registered? <Link className="font-medium text-zinc-950 underline" href="/login">Sign in</Link>
      </p>
    </form>
  );
}
