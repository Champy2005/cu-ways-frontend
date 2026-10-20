import type { ReactNode } from "react";

import { MarketerPageHeader } from "@/features/marketer-discovery/components/marketer-page-header";

type MarketerDetailShellProps = {
  title: string;
  subtitle: string;
  backHref: string;
  children: ReactNode;
};

/** Shared frame for the three profile sub-pages: header and body. */
export function MarketerDetailShell({
  title,
  subtitle,
  backHref,
  children,
}: MarketerDetailShellProps) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col">
      <MarketerPageHeader title={title} subtitle={subtitle} backHref={backHref} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
