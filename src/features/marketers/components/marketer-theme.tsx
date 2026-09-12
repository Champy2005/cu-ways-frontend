"use client";
import type { NavigationDevice } from "@/components/layout/navigation-device";
import Image from "next/image";
import { Moon, Sun } from "lucide-react";
import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
const THEME_KEY = "cuways-marketer-theme";
const THEME_EVENT = "cuways-marketer-theme-change";
type Theme = "light" | "dark" | "system";
let memoryTheme: "light" | "dark" | undefined;

function subscribeTheme(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", callback);
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_EVENT, callback);
  return () => {
    media.removeEventListener("change", callback);
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_EVENT, callback);
  };
}

function readTheme(): "light" | "dark" {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    memoryTheme = stored === "dark" || stored === "light" ? stored : undefined;
  } catch {
    // Keep an explicit choice in memory when storage is unavailable.
  }
  return (
    memoryTheme ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  );
}

// CSS resolves the system preference before hydration on a first visit.
const serverTheme = () => "system" as const;
const ThemeContext = createContext<Theme>("system");
export function MarketerTheme({
  children,
  device = "desktop",
}: {
  children: ReactNode;
  device?: NavigationDevice;
}) {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, serverTheme);
  return (
    <ThemeContext value={theme}>
      <div className="marketer-theme min-h-dvh" data-theme={theme} data-navigation={device}>
        {children}
      </div>
    </ThemeContext>
  );
}
export function MarketerLogo() {
  const theme = useContext(ThemeContext);
  return (
    <picture>
      {theme === "system" && (
        <source media="(prefers-color-scheme: dark)" srcSet="/marketer-assets/logo-dark.svg" />
      )}
      <Image
        src={theme === "dark" ? "/marketer-assets/logo-dark.svg" : "/marketer-assets/logo.svg"}
        width={152}
        height={42}
        alt="CU Ways"
        className="mk-logo"
        loading="eager"
      />
    </picture>
  );
}
export function MarketerThemeToggle() {
  const theme = useContext(ThemeContext);
  function toggleTheme() {
    memoryTheme = readTheme() === "light" ? "dark" : "light";
    try {
      localStorage.setItem(THEME_KEY, memoryTheme);
    } catch {
      // A blocked storage policy must not break navigation or the current form.
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }
  return (
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
  );
}
