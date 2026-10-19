import Link from "next/link";

export default function DashboardPage() {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">Workspace</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">Dashboard</h1>
      <p className="mt-3 text-zinc-600">
        Your CU Ways workspace is ready. Choose an area to continue.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          ["Profile", "Manage your personal information.", "/profile"],
          [
            "Marketer workspace",
            "Manage your professional profile, services, and performance.",
            "/marketer/dashboard",
          ],
          ["Surveys", "Share your perspective and discover surveys.", "/surveys"],
          ["Jobs", "Explore opportunities and active work.", "/jobs"],
        ].map(([title, description, href]) => (
          <Link
            key={href}
            href={href}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-400"
          >
            <h2 className="font-semibold text-zinc-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
