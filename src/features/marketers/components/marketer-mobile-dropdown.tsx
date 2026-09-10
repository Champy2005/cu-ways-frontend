"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Home, LogOut, Menu, MessageSquare, UserRound } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { getDemoView } from "./marketer-navigation";
import { useLogout } from "@/components/layout/use-logout";
import { navigateDemo, useLocalQuery } from "../local-navigation";

export default function MarketerMobileMenu({
  demo,
  initialView,
}: {
  demo: boolean;
  initialView?: string;
}) {
  const { logout, isPending, error } = useLogout();
  const [open, setOpen] = useState(false);
  const portal = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const view = useLocalQuery("view", initialView ?? "dashboard");
  const selected = demo ? getDemoView(view) : pathname.split("/").at(-1);
  return (
    <>
      <div ref={portal} />
      <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          aria-label="Open navigation menu"
          render={<Button variant="ghost" className="mk-icon-button mk-mobile-menu-trigger" />}
        >
          <Menu aria-hidden="true" className="size-6" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          container={portal}
          align="end"
          sideOffset={18}
          collisionPadding={0}
          className="mk-header-menu"
          aria-label="Your workspace"
        >
          {[
            { id: "dashboard", label: "Dashboard", icon: Home, disabled: false },
            { id: "jobs", label: "Jobs", icon: Briefcase, disabled: true },
            { id: "messages", label: "Messages", icon: MessageSquare, disabled: true },
            { id: "profile", label: "Profile", icon: UserRound, disabled: false },
          ].map(({ id, label, icon: Icon, disabled }) => (
            <DropdownMenuItem
              key={id}
              disabled={disabled}
              aria-label={disabled ? `${label} — Coming soon` : undefined}
              aria-current={selected === id ? "page" : undefined}
              render={
                disabled ? undefined : (
                  <Link
                    href={demo ? `/demo/marketer?view=${id}` : `/marketer/${id}`}
                    prefetch={demo ? false : undefined}
                    onClick={(event) => {
                      if (demo) navigateDemo(event, id);
                      setOpen(false);
                    }}
                  />
                )
              }
            >
              <Icon aria-hidden="true" />
              {label}
              {disabled && <span className="mk-menu-unavailable"> Coming soon</span>}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem disabled={demo || isPending} onClick={logout}>
            <LogOut aria-hidden="true" />
            {isPending ? "Signing out…" : "Sign out"}
            {demo && <span className="mk-menu-unavailable"> Preview only</span>}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {error && (
        <p role="alert" className="text-sm text-[var(--mk-error)]">
          {error}
        </p>
      )}
    </>
  );
}
