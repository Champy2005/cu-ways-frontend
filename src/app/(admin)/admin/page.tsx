import Link from "next/link";

export default function AdminPage() {
  return (
    <section className="space-y-4 text-zinc-950">
      <h1 className="text-2xl font-semibold">Admin workspace</h1>
      <ul className="space-y-2">
        <li>
          <Link href="/admin/users" className="underline">
            Users
          </Link>
        </li>
        <li>
          <Link href="/admin/jobs" className="underline">
            Jobs and payments
          </Link>
        </li>
        <li>
          <Link href="/admin/flagged-marketers" className="underline">
            Flagged marketers
          </Link>
        </li>
      </ul>
    </section>
  );
}
