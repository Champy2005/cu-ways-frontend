"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleAlert, CircleUserRound, Eye, EyeOff, Lock } from "lucide-react";

import { ApiError, getDisplayError } from "@/lib/api/errors";
import { safeReturnPath } from "@/lib/auth/workspace";
import { login } from "@/features/auth/api";
import { loginFieldErrors } from "@/features/auth/schemas";
import type { LoginRequest } from "@/features/auth/types";

const INVALID_CREDENTIALS_MESSAGE = "Incorrect email or password. Please try again.";

function isCredentialsFailure(error: unknown): boolean {
  // 401 from the backend, 400/422 when the BFF rejects a malformed (e.g. too short) password.
  return error instanceof ApiError && [400, 401, 422].includes(error.status);
}

export function LoginForm() {
  const router = useRouter();
  const [values, setValues] = useState<LoginRequest>({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // The Figma invalid / error states grey the button out until the user edits a field.
  const hasProblem = Boolean(error) || Object.keys(fieldErrors).length > 0;

  function update(field: keyof LoginRequest, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors({});
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = loginFieldErrors(values);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    // The backend rejects passwords outside 8-128 chars, so none can be correct: fail locally
    // with the generic message instead of sending a request (and without revealing the policy).
    if (values.password.length < 8 || values.password.length > 128) {
      setError(INVALID_CREDENTIALS_MESSAGE);
      return;
    }

    setIsPending(true);
    setError(null);
    try {
      const session = await login(values);
      router.push(
        safeReturnPath(new URLSearchParams(window.location.search).get("next")) ??
          (session.role === "admin" ? "/admin" : "/dashboard"),
      );
      router.refresh();
    } catch (requestError) {
      setError(
        isCredentialsFailure(requestError)
          ? INVALID_CREDENTIALS_MESSAGE
          : getDisplayError(requestError),
      );
      setIsPending(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="login-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="login-mascot" src="/marketer-assets/mascot-pink.svg" alt="" />
        <h2 className="login-card-title">Sign in</h2>
        <div className="login-field">
          <div className="login-input-wrap" data-invalid={Boolean(fieldErrors.email)}>
            <CircleUserRound size={20} aria-hidden />
            <input
              id="login-email"
              className="login-input"
              type="email"
              autoComplete="email"
              aria-label="Email"
              aria-invalid={Boolean(fieldErrors.email)}
              value={values.email}
              onChange={(event) => update("email", event.target.value)}
              placeholder="Email"
            />
          </div>
          {fieldErrors.email ? (
            <p className="login-field-error" role="alert">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>
        <div className="login-field">
          <div className="login-input-wrap" data-invalid={Boolean(fieldErrors.password)}>
            <Lock size={20} aria-hidden />
            <input
              id="login-password"
              className="login-input"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              aria-label="Password"
              aria-invalid={Boolean(fieldErrors.password)}
              value={values.password}
              onChange={(event) => update("password", event.target.value)}
              placeholder="Password"
            />
            <button
              type="button"
              className="login-eye"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
          {fieldErrors.password ? (
            <p className="login-field-error" role="alert">
              {fieldErrors.password}
            </p>
          ) : null}
        </div>
        {error ? (
          <p className="login-alert" role="alert">
            <CircleAlert size={14} aria-hidden />
            {error}
          </p>
        ) : null}
        <button type="submit" className="login-submit" disabled={isPending || hasProblem}>
          {isPending ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="login-register">
        No account? <Link href="/register">Create one</Link>
      </p>
    </>
  );
}
