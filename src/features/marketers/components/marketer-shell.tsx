import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { MarketerTheme, MarketerLogo, MarketerThemeToggle } from "./marketer-theme";
import { MarketerNavigation } from "./marketer-navigation";
import { MarketerMobileMenu } from "./marketer-mobile-menu";
import "../marketer.css";
export function MarketerShell({
  children,
  demo = false,
  demoView,
}: {
  children: ReactNode;
  demo?: boolean;
  demoView?: string;
}) {
  return (
    <MarketerTheme>
      <a className="mk-skip" href="#marketer-content">
        Skip to content
      </a>
      <header className="mk-header">
        <div className="mk-frame mk-header-inner">
          <Link
            href={demo ? "/demo/marketer" : "/marketer/dashboard"}
            aria-label="CU Ways marketer home"
            className="shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            <MarketerLogo />
          </Link>
          <div className="flex items-center gap-1.5 md:gap-4">
            <Link
              href="/dashboard"
              className="mk-workspace-link hidden items-center gap-2 text-sm md:inline-flex"
            >
              <ArrowLeft size={14} /> Workspace
            </Link>
            <MarketerThemeToggle />
            <Image
              src="/marketer-assets/mascot.svg"
              width={36}
              height={34}
              alt=""
              loading="eager"
              className="mk-header-mascot"
            />
            <MarketerMobileMenu demo={demo} initialView={demoView} />
          </div>
        </div>
      </header>
      {!demo && (
        <div className="mk-frame mk-live-navigation">
          <MarketerNavigation />
        </div>
      )}
      <main id="marketer-content" className="mk-frame mk-main" tabIndex={-1}>
        {children}
      </main>
      <MarketerNavigation demo={demo} selected={demoView} variant="mobile" />
    </MarketerTheme>
  );
}
