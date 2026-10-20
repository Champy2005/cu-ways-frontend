import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackLink({
  href,
  label,
  showLabel = false,
}: {
  href: string;
  label: string;
  showLabel?: boolean;
}) {
  return (
    <Link href={href} aria-label={label} className="workspace-back">
      <ArrowLeft aria-hidden="true" className="size-5" />
      {showLabel && <span>{label}</span>}
    </Link>
  );
}
