"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Home, LogOut, Menu, Search } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogout } from "@/components/layout/use-logout";

export const creatorViews = [
  { href: "/creator/dashboard", label: "Overview", icon: Home },
  { href: "/creator/discovery", label: "Marketer discovery", icon: Search },
] as const;

export function CreatorMenu() {
  const { logout, isPending, error } = useLogout();
  const [open, setOpen] = useState(false);
  const portal = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  return (
    <>
      <div ref={portal} />
      <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          aria-label="Open navigation menu"
          render={
            <Button
              variant="ghost"
              className="mk-icon-button mk-mobile-menu-trigger mk-menu-always"
            />
          }
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
          {creatorViews.map(({ href, label, icon: Icon }) => (
            <DropdownMenuItem
              key={href}
              aria-current={pathname === href ? "page" : undefined}
              render={<Link href={href} onClick={() => setOpen(false)} />}
            >
              <Icon aria-hidden="true" />
              {label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem render={<Link href="/dashboard" onClick={() => setOpen(false)} />}>
            <ArrowLeft aria-hidden="true" /> Workspace
          </DropdownMenuItem>
          <DropdownMenuItem disabled={isPending} onClick={logout}>
            <LogOut aria-hidden="true" />
            {isPending ? "Signing out…" : "Sign out"}
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
