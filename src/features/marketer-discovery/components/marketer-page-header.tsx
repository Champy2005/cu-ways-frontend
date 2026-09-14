import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type MarketerPageHeaderProps = {
  title: string;
  subtitle: string;
  backHref: string;
  backLabel?: string;
};

export function MarketerPageHeader({
  title,
  subtitle,
  backHref,
  backLabel = "Back",
}: MarketerPageHeaderProps) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <Link
        href={backHref}
        aria-label={backLabel}
        className="-ml-2 flex size-9 shrink-0 items-center justify-center rounded-full text-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
      </Link>
      <div className="min-w-0">
        <h1 className="truncate text-sm font-medium text-foreground">{title}</h1>
        <p className="truncate text-[11px] text-foreground/45">{subtitle}</p>
      </div>
    </div>
  );
}
