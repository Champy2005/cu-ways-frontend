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
export function MarketerIdentity({ name }: { name: string }) {
  return (
    <section aria-label="Marketer identity" className="mk-identity">
      <MarketerAvatar name={name} />
      <div className="min-w-0 pb-2 pr-2">
        <p className="text-base font-medium text-[#72c8ef]">Marketer</p>
        <p className="mt-2 text-base font-medium wrap-anywhere sm:text-xl">{name}</p>
      </div>
      <Image
        src="/marketer-assets/mascot.svg"
        width={74}
        height={70}
        alt=""
        aria-hidden="true"
        className="mk-identity-mascot"
      />
    </section>
  );
}
