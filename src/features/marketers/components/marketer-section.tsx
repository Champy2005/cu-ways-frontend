import type { ReactNode } from "react";
import Link from "next/link";

type MarketerSectionProps = {
  title: string;
  detailHref?: string;
  children: ReactNode;
};

export function MarketerSection({ title, detailHref, children }: MarketerSectionProps) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-base font-medium text-foreground">{title}</h2>
        {detailHref ? (
          <Link
            href={detailHref}
            className="text-sm font-medium text-muted-strong underline underline-offset-2 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Detail
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
