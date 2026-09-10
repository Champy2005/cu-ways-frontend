"use client";
import type { NavigationDevice } from "@/components/layout/navigation-device";
import Image from "next/image";
import { Moon, Sun } from "lucide-react";
import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
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

const ThemeContext = createContext<"light" | "dark">("light");
export function MarketerTheme({
  children,
  device = "desktop",
}: {
  children: ReactNode;
  device?: NavigationDevice;
}) {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, lightTheme);
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
    <Image
      src={theme === "dark" ? "/marketer-assets/logo-dark.svg" : "/marketer-assets/logo.svg"}
      width={152}
      height={42}
      alt="CU Ways"
      className="mk-logo"
      loading="eager"
    />
  );
}
export function MarketerThemeToggle() {
  const theme = useContext(ThemeContext);
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
