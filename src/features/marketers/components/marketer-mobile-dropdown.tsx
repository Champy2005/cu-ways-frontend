"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, LogOut, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { NavigationDevice } from "@/components/layout/navigation-device";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { demoViews, ownerViews, getDemoView } from "./marketer-navigation";
import { useLogout } from "@/components/layout/use-logout";
import { navigateDemo, useLocalQuery } from "../local-navigation";

export default function MarketerMobileMenu({
  demo,
  initialView,
  device,
}: {
  demo: boolean;
  initialView?: string;
  device: NavigationDevice;
}) {
  const { logout, isPending, error } = useLogout();
  const [open, setOpen] = useState(false);
  const portal = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const view = useLocalQuery("view", initialView ?? "dashboard");
  const selected = demo ? getDemoView(view) : pathname.split("/").at(-1);
  useEffect(() => {
    if (device !== "desktop") return;
    const media = window.matchMedia("(min-width: 1024px)");
    const closeOnWide = () => {
      if (media.matches) setOpen(false);
    };
    media.addEventListener("change", closeOnWide);
    return () => media.removeEventListener("change", closeOnWide);
  }, [device]);
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
          {(demo ? demoViews : ownerViews).map(({ id, label, icon: Icon }) => (
            <DropdownMenuItem
              key={id}
              aria-current={selected === id ? "page" : undefined}
              render={
                <Link
                  href={demo ? `/demo/marketer?view=${id}` : `/marketer/${id}`}
                  prefetch={demo ? false : undefined}
                  onClick={(event) => {
                    if (demo) navigateDemo(event, id);
                    setOpen(false);
                  }}
                />
              }
            >
              <Icon aria-hidden="true" />
              {label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem render={<Link href="/dashboard" onClick={() => setOpen(false)} />}>
            <ArrowLeft aria-hidden="true" /> Workspace
          </DropdownMenuItem>
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
