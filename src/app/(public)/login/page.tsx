import { Inter } from "next/font/google";

import { LoginForm } from "@/features/auth/components/login-form";

import "@/features/auth/login.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function LoginPage() {
  return (
    <main className={`login-page ${inter.variable}`}>
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
