"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { demoViews, ownerViews, getDemoView } from "./marketer-navigation";
import { navigateDemo, useLocalQuery } from "../local-navigation";

export default function MarketerMobileMenu({
  demo,
  initialView,
}: {
  demo: boolean;
  initialView?: string;
}) {
  const [open, setOpen] = useState(false);
  const portal = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const view = useLocalQuery("view", initialView ?? "dashboard");
  const selected = demo ? getDemoView(view) : pathname.split("/").at(-1);
  useEffect(() => {
    if (!open) return;
    const desktop = window.matchMedia("(min-width: 768px)");
    const close = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", close);
    return () => desktop.removeEventListener("change", close);
  }, [open]);
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
          sideOffset={12}
          collisionPadding={16}
          className="w-60 max-w-[calc(100vw-2rem)] rounded-2xl border border-[var(--mk-border)] p-2 shadow-xl"
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
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href="/dashboard" onClick={() => setOpen(false)} />}>
            <ArrowLeft aria-hidden="true" />
            Back to workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
