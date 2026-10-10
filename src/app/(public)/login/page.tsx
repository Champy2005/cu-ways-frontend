import { LoginForm } from "@/features/auth/components/login-form";

import "@/features/auth/login.css";

export default function LoginPage() {
  return (
    <main className="login-page">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="login-logo login-logo-light" src="/marketer-assets/logo.svg" alt="CU Ways" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="login-logo login-logo-dark"
        src="/marketer-assets/logo-dark.svg"
        alt="CU Ways"
      />
      <h1 className="login-title">Welcome back</h1>
      <p className="login-subtitle">nice to see you again</p>
      <LoginForm />
    </main>
  );
}
