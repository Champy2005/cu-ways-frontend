"use client";

import Link from "next/link";
import { Briefcase, Eye, Home, Mail, UserRound } from "lucide-react";

import { navigateDemo, useLocalQuery } from "../local-navigation";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const ownerViews = [
  { id: "dashboard", label: "Overview", icon: Home },
  { id: "services", label: "Services", icon: Briefcase },
  { id: "invitations", label: "Invitations", icon: Mail },
  { id: "profile", label: "Profile", icon: UserRound },
] as const;

export const demoViews = [
  ...ownerViews,
  { id: "viewer", label: "Creator view", icon: Eye },
] as const;

export function getDemoView(view?: string) {
  if (view === "offer") return "offer";
  return demoViews.find((entry) => entry.id === view)?.id ?? "dashboard";
}

export function MarketerNavigation({
  demo = false,
  selected,
  variant = "desktop",
  onNavigate,
}: {
  demo?: boolean;
  selected?: string;
  variant?: "desktop" | "mobile" | "menu";
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const localView = useLocalQuery("view", selected ?? "dashboard");
  const view = demo ? getDemoView(localView) : (selected ?? pathname.split("/").at(-1));
  const active = view === "offer" || pathname.startsWith("/marketer/offer/") ? "invitations" : view;
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
          aria-current={active === id ? "page" : undefined}
          data-view={id}
          className="mk-nav-link"
          prefetch={demo ? false : undefined}
          onClick={(event) => {
            if (demo) navigateDemo(event, id);
            onNavigate?.();
          }}
        >
          <Icon aria-hidden="true" size={20} strokeWidth={1.8} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
