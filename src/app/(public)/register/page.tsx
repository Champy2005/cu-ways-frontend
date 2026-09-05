import { RegisterForm } from "@/features/auth/components/register-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16">
      <section className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">CU Ways</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
          Create an account
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Start building your profile and exploring opportunities.
        </p>
        <div className="mt-8">
          <RegisterForm />
        </div>
      </section>
    </main>
  );
}
