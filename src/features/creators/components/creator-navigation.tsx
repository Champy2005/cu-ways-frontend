"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { creatorViews } from "./creator-menu";

export function CreatorNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label={mobile ? "Mobile creator navigation" : "Creator navigation"}
      className={`mk-navigation mk-navigation-${mobile ? "mobile" : "desktop"}`}
    >
      {creatorViews.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="mk-nav-link"
          aria-current={
            pathname === href || (href !== "/creator/dashboard" && pathname.startsWith(`${href}/`))
              ? "page"
              : undefined
          }
        >
          <Icon aria-hidden="true" size={20} strokeWidth={1.8} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
