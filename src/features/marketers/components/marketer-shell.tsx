import type { NavigationDevice } from "@/components/layout/navigation-device";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { MarketerTheme, MarketerLogo, MarketerThemeToggle } from "./marketer-theme";
import { MarketerNavigation } from "./marketer-navigation";
import { MarketerMobileMenu } from "./marketer-mobile-menu";
import { MarketerRolePicker } from "./marketer-role-picker";
import "../marketer.css";
export function MarketerShell({
  children,
  device = "desktop",
  demo = false,
  demoView,
}: {
  children: ReactNode;
  device?: NavigationDevice;
  demo?: boolean;
  demoView?: string;
}) {
  return (
    <MarketerTheme device={device}>
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
          {device === "desktop" && <MarketerNavigation demo={demo} selected={demoView} />}
          <div className="mk-header-actions flex items-center gap-1.5 md:gap-4">
            {device === "desktop" && (
              <Link
                href="/dashboard"
                className="mk-workspace-link inline-flex items-center gap-2 text-sm"
              >
                <ArrowLeft size={14} /> Workspace
              </Link>
            )}
            <MarketerThemeToggle />
            <MarketerRolePicker />
            <MarketerMobileMenu demo={demo} initialView={demoView} device={device} />
          </div>
        </div>
      </header>
      <main id="marketer-content" className="mk-frame mk-main" tabIndex={-1}>
        {children}
      </main>
      {device === "mobile" && (
        <MarketerNavigation demo={demo} selected={demoView} variant="mobile" />
      )}
    </MarketerTheme>
  );
}
