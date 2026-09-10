import Image from "next/image";

import { cn } from "@/lib/utils";

export function MarketerAvatar({ name, className }: { name: string; className?: string }) {
  const initial = Array.from(name.trim().toLocaleUpperCase())[0] ?? "?";

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-20 shrink-0 items-center justify-center rounded-full border-2 border-[#2ce07f] bg-[#dbf8e8] text-3xl font-semibold text-[#18492f]",
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
    <section
      aria-label="Marketer identity"
      className="relative flex min-h-[120px] items-center gap-5 rounded-[18px] bg-[var(--mk-identity-bg,#0d111a)] px-5 py-5 text-[var(--mk-identity-text,#f9f9f9)] shadow-sm sm:gap-6 sm:px-7"
    >
      <MarketerAvatar name={name} />
      <div className="min-w-0 pb-2 pr-2">
        <p className="text-base font-medium text-[#429ec3]">Marketer</p>
        <p className="mt-2 text-base font-medium wrap-anywhere sm:text-xl">{name}</p>
      </div>
      <Image
        src="/marketer-assets/mascot.svg"
        width={74}
        height={70}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-3 -bottom-5 h-[70px] w-[74px]"
      />
    </section>
  );
}
