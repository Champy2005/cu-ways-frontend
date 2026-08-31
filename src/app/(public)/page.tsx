import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-[calc(100vh-1px)] items-center justify-center bg-zinc-50 px-6 py-16">
      <section className="w-full max-w-5xl">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">CU Ways</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight text-zinc-950 sm:text-7xl">Find your next way forward.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-600">A focused workspace for connecting people, services, surveys, and opportunities.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-950 px-3 text-sm font-medium text-white transition hover:bg-zinc-800">
              Get started
            </Link>
            <Link href="/login" className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-100">
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
