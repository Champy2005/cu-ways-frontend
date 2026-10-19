import Link from "next/link";
import type { ReactNode } from "react";

import type { NavigationDevice } from "@/components/layout/navigation-device";
import { CreatorMenu } from "@/features/creators/components/creator-menu";
import { MarketerRolePicker } from "@/features/marketers/components/marketer-role-picker";
import {
  MarketerLogo,
  MarketerTheme,
  MarketerThemeToggle,
} from "@/features/marketers/components/marketer-theme";
import "@/features/marketers/marketer.css";

/** Creator workspace chrome, sharing the marketer theme with a creator-specific menu. */
export function CreatorShell({
  children,
  device = "desktop",
}: {
  children: ReactNode;
  device?: NavigationDevice;
}) {
  return (
    <MarketerTheme device={device}>
      <a className="mk-skip" href="#creator-content">
        Skip to content
      </a>
      <header className="mk-header">
        <div className="mk-frame mk-header-inner">
          <Link
            href="/creator/dashboard"
            aria-label="CU Ways creator home"
            className="shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            <MarketerLogo />
          </Link>
          <div className="mk-header-actions flex items-center gap-1.5 md:gap-4">
            <MarketerThemeToggle />
            <MarketerRolePicker initialRole="Creator" />
            <CreatorMenu />
          </div>
        </div>
      </header>
      <main id="creator-content" className="mk-frame mk-main" tabIndex={-1}>
        {children}
      </main>
    </MarketerTheme>
  );
}
