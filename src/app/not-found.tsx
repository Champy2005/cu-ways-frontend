import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">404</p>
        <h1 className="mt-3 text-3xl font-semibold text-zinc-950">Page not found</h1>
        <Link href="/" className="mt-6 inline-block text-sm font-medium text-zinc-950 underline">Return home</Link>
      </div>
    </main>
  );
}
