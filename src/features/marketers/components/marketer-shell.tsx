"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, ArrowLeft } from "lucide-react";
import { useRef, useSyncExternalStore, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { getDemoView, MarketerNavigation } from "./marketer-navigation";
import { MarketerMobileMenu } from "./marketer-mobile-menu";
import "../marketer.css";

const THEME_KEY = "cuways-marketer-theme";
const THEME_EVENT = "cuways-marketer-theme-change";
let cachedTheme: "light" | "dark" = "light";
let lastThemeSetting: string | null | undefined;

function subscribeTheme(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_EVENT, callback);
  };
}

function readTheme(): "light" | "dark" {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored !== lastThemeSetting) {
      cachedTheme = stored === "dark" ? "dark" : "light";
      lastThemeSetting = stored;
    }
  } catch {
    // Keep the selected theme in memory if browser storage is blocked.
  }
  return cachedTheme;
}

const lightTheme = () => "light" as const;
export function MarketerShell({
  children,
  demo = false,
  demoView,
}: {
  children: ReactNode;
  demo?: boolean;
  demoView?: string;
}) {
  const pathname = usePathname();
  const menuContainer = useRef<HTMLDivElement>(null);
  const selected = demo ? getDemoView(demoView) : (pathname.split("/").at(-1) ?? "dashboard");
  const theme = useSyncExternalStore(subscribeTheme, readTheme, lightTheme);

  function toggleTheme() {
    cachedTheme = theme === "light" ? "dark" : "light";
    try {
      localStorage.setItem(THEME_KEY, cachedTheme);
      lastThemeSetting = cachedTheme;
    } catch {
      // A blocked storage policy must not break navigation or the current form.
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  return (
    <div className="marketer-theme min-h-dvh" data-theme={theme}>
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
            <Image
              src={
                theme === "dark" ? "/marketer-assets/logo-dark.svg" : "/marketer-assets/logo.svg"
              }
              width={152}
              height={42}
              alt="CU Ways"
              className="mk-logo"
              loading="eager"
            />
          </Link>
          <div className="flex items-center gap-1.5 md:gap-4">
            <Link
              href="/dashboard"
              className="mk-workspace-link hidden items-center gap-2 text-sm md:inline-flex"
            >
              <ArrowLeft size={14} /> Workspace
            </Link>
            <Button
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
              title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
              variant="ghost"
              size="icon-lg"
              onClick={toggleTheme}
              className="mk-icon-button mk-theme-button"
            >
              {theme === "light" ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </Button>
            <Image
              src="/marketer-assets/mascot.svg"
              width={36}
              height={35}
              alt=""
              loading="eager"
              className="mk-header-mascot"
            />
            <MarketerMobileMenu demo={demo} selected={selected} portalContainer={menuContainer} />
          </div>
        </div>
      </header>
      <div ref={menuContainer} />
      {!demo && (
        <div className="mk-frame mk-live-navigation">
          <MarketerNavigation selected={selected} />
        </div>
      )}
      <main id="marketer-content" className="mk-frame mk-main" tabIndex={-1}>
        {children}
      </main>
      <MarketerNavigation demo={demo} selected={selected} variant="mobile" />
    </div>
  );
}
