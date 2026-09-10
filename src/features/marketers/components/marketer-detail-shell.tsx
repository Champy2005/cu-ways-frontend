import type { ReactNode } from "react";

import { MarketerPageHeader } from "@/features/marketers/components/marketer-page-header";
import { SendCustomJobButton } from "@/features/marketers/components/send-custom-job-button";

type MarketerDetailShellProps = {
  title: string;
  subtitle: string;
  backHref: string;
  children: ReactNode;
};

/** Shared frame for the three profile sub-pages: header, body, sticky CTA. */
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
      <div className="sticky bottom-0 z-10 mt-8 bg-surface py-4">
        <SendCustomJobButton />
      </div>
    </div>
  );
}
