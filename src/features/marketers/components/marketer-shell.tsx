"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Home, Moon, Sun, UserRound, ArrowLeft } from "lucide-react";
import { useSyncExternalStore, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
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
const navigation = [
  { id: "dashboard", label: "Overview", icon: Home },
  { id: "services", label: "Services", icon: Briefcase },
  { id: "profile", label: "Profile", icon: UserRound },
] as const;

export function MarketerShell({ children, demo = false }: { children: ReactNode; demo?: boolean }) {
  const pathname = usePathname();
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
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-6 py-6 md:px-10">
        <Link
          href={demo ? "/demo/marketer" : "/marketer/dashboard"}
          aria-label="CU Ways marketer home"
          className="shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <Image
            src="/marketer-assets/logo.png"
            width={122}
            height={35}
            alt="CU Ways"
            className="mk-logo h-[35px] w-[122px] object-contain"
          />
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="mk-workspace-link hidden items-center gap-2 text-xs sm:inline-flex"
          >
            <ArrowLeft size={14} /> Workspace
          </Link>
          <Button
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            variant="ghost"
            size="icon-lg"
            onClick={toggleTheme}
            className="mk-theme-button"
          >
            {theme === "light" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
          <Image
            src="/marketer-assets/mascot.svg"
            width={36}
            height={35}
            alt=""
            loading="eager"
            className="h-[35px] w-9"
          />
        </div>
      </header>
      {!demo && (
        <nav
          aria-label="Marketer navigation"
          className="mx-auto mb-5 hidden max-w-5xl gap-2 px-10 md:flex"
        >
          {navigation.map(({ id, label, icon: Icon }) => (
            <Link
              key={id}
              href={`/marketer/${id}`}
              aria-current={pathname === `/marketer/${id}` ? "page" : undefined}
              className="mk-nav-link flex items-center gap-2 rounded-full px-5 py-2.5 text-sm"
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>
      )}
      <main
        id="marketer-content"
        className="mx-auto w-full max-w-5xl px-6 pb-28 pt-2 md:px-10 md:pb-14"
        tabIndex={-1}
      >
        {children}
      </main>
      {!demo && (
        <nav
          aria-label="Mobile marketer navigation"
          className="mk-bottom-nav fixed bottom-5 left-1/2 z-20 flex w-[calc(100%-3rem)] max-w-sm -translate-x-1/2 items-center justify-around gap-2 rounded-full border px-3 py-2 shadow-lg md:hidden"
        >
          {navigation.map(({ id, label, icon: Icon }) => (
            <Link
              key={id}
              href={`/marketer/${id}`}
              aria-current={pathname === `/marketer/${id}` ? "page" : undefined}
              className="mk-nav-link flex min-w-16 flex-col items-center gap-1 rounded-2xl px-3 py-1.5 text-[10px]"
            >
              <Icon size={22} />
              {label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
