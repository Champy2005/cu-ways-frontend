"use client";

import { Dialog } from "@base-ui/react/dialog";
import Link from "next/link";
import { ArrowLeft, Menu, X } from "lucide-react";
import { useEffect, useState, type RefObject } from "react";

import { Button } from "@/components/ui/button";
import { MarketerNavigation } from "./marketer-navigation";

export function MarketerMobileMenu({
  demo,
  selected,
  portalContainer,
}: {
  demo: boolean;
  selected: string;
  portalContainer: RefObject<HTMLDivElement | null>;
}) {
  const [open, setOpen] = useState(false);

  // Resizing into the desktop layout must not leave an invisible modal or scroll lock.
  useEffect(() => {
    if (!open) return;
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label="Open navigation menu"
        render={<Button variant="ghost" className="mk-icon-button mk-mobile-menu-trigger" />}
      >
        <Menu aria-hidden="true" className="size-6" />
      </Dialog.Trigger>
      <Dialog.Portal container={portalContainer}>
        <Dialog.Backdrop className="mk-dialog-backdrop fixed inset-0 z-[60]" />
        <Dialog.Popup className="mk-menu-popup mk-dialog-surface fixed inset-x-4 top-4 z-[70] rounded-3xl p-5 outline-none">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <Dialog.Title className="text-lg font-semibold">Your workspace</Dialog.Title>
              <Dialog.Description className="mt-1 text-xs text-[var(--mk-muted)]">
                {demo ? "Preview the marketer experience." : "Manage your marketer account."}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close navigation menu"
              render={<Button variant="ghost" className="mk-icon-button" />}
            >
              <X aria-hidden="true" className="size-5" />
            </Dialog.Close>
          </div>
          <MarketerNavigation
            demo={demo}
            selected={selected}
            variant="menu"
            onNavigate={() => setOpen(false)}
          />
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="mk-menu-workspace mt-5 flex min-h-11 items-center gap-3 border-t border-[var(--mk-border)] pt-4 text-sm text-[var(--mk-muted)]"
          >
            <ArrowLeft aria-hidden="true" size={18} /> Back to workspace
          </Link>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
