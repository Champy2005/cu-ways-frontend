"use client";

import Link from "next/link";
import { Briefcase, Eye, Home, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

const ownerViews = [
  { id: "dashboard", label: "Overview", icon: Home },
  { id: "services", label: "Services", icon: Briefcase },
  { id: "profile", label: "Profile", icon: UserRound },
] as const;

export const demoViews = [
  ...ownerViews,
  { id: "viewer", label: "Creator view", icon: Eye },
] as const;

export function getDemoView(view?: string) {
  return demoViews.find((entry) => entry.id === view)?.id ?? "dashboard";
}

export function MarketerNavigation({
  demo = false,
  selected,
  variant = "desktop",
  onNavigate,
}: {
  demo?: boolean;
  selected: string;
  variant?: "desktop" | "mobile" | "menu";
  onNavigate?: () => void;
}) {
  const label = demo ? "Demo views" : "Marketer navigation";
  return (
    <nav
      aria-label={
        variant === "desktop"
          ? label
          : `${variant === "mobile" ? "Mobile" : "Menu"} ${label.toLowerCase()}`
      }
      className={cn("mk-navigation", `mk-navigation-${variant}`)}
    >
      {(demo ? demoViews : ownerViews).map(({ id, label, icon: Icon }) => (
        <Link
          key={id}
          href={demo ? `/demo/marketer?view=${id}` : `/marketer/${id}`}
          aria-current={selected === id ? "page" : undefined}
          className="mk-nav-link"
          onClick={onNavigate}
        >
          <Icon aria-hidden="true" size={20} strokeWidth={1.8} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
