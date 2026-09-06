"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDisplayError } from "@/lib/api/errors";
import { login } from "@/features/auth/api";
import { loginValidationMessage } from "@/features/auth/schemas";
import type { LoginRequest } from "@/features/auth/types";

export function LoginForm() {
  const router = useRouter();
  const [values, setValues] = useState<LoginRequest>({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function update(field: keyof LoginRequest, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = loginValidationMessage(values);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsPending(true);
    setError(null);
    try {
      await login(values);
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
        <label className="mb-2 block text-sm font-medium text-zinc-800" htmlFor="login-email">
          Email
        </label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(event) => update("email", event.target.value)}
          placeholder="you@example.com"
          required
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-800" htmlFor="login-password">
          Password
        </label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={(event) => update("password", event.target.value)}
          required
        />
      </div>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={isPending} size="lg">
        {isPending ? "Signing in..." : "Sign in"}
      </Button>
      <p className="text-center text-sm text-zinc-600">
        No account?{" "}
        <Link className="font-medium text-zinc-950 underline" href="/register">
          Create one
        </Link>
      </p>
    </form>
  );
}
