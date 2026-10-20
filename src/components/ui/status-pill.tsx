import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** One status palette for jobs, invitations, and offers in both themes. */
export function StatusPill({
  status,
  children,
  className,
}: {
  status: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("workspace-status", className)} data-status={status}>
      {children ?? status}
    </span>
  );
}
