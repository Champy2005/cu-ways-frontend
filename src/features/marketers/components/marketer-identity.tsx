import Image from "next/image";

import { cn } from "@/lib/utils";

export function MarketerAvatar({ name, className }: { name: string; className?: string }) {
  const initial = Array.from(name.trim().toLocaleUpperCase())[0] ?? "?";

  return (
    <span
      aria-hidden="true"
      className={cn(
        "mk-avatar flex size-20 shrink-0 items-center justify-center rounded-full text-3xl font-semibold",
        className,
      )}
    >
      {initial}
    </span>
  );
}

/** Display-safe identity, shared by owner and viewer screens. */
export function MarketerIdentity({
  name,
  roleLabel = "Marketer",
  mascotSrc = "/marketer-assets/mascot.svg",
  tone = "blue",
}: {
  name: string;
  roleLabel?: string;
  mascotSrc?: string;
  /** Label color: blue for marketers, pink for creators, matching the mascot. */
  tone?: "blue" | "pink";
}) {
  return (
    <section aria-label={`${roleLabel} identity`} className="mk-identity">
      <MarketerAvatar name={name} />
      <div className="min-w-0 pb-2 pr-2">
        <p
          className={cn(
            "text-base font-medium",
            tone === "pink" ? "text-[var(--mk-accent)]" : "text-[var(--mk-secondary)]",
          )}
        >
          {roleLabel}
        </p>
        <p className="mt-2 text-base font-medium wrap-anywhere sm:text-xl">{name}</p>
      </div>
      <Image
        src={mascotSrc}
        width={74}
        height={70}
        alt=""
        aria-hidden="true"
        className="mk-identity-mascot"
      />
    </section>
  );
}
