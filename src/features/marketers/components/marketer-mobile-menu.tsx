"use client";
import { lazy, Suspense } from "react";
const MobileDropdown = lazy(() => import("./marketer-mobile-dropdown"));
/** Only mounted by the mobile device shell; resizing never switches navigation. */
export function MarketerMobileMenu(props: { demo: boolean; initialView?: string }) {
  return (
    <Suspense
      fallback={
        <span
          aria-label="Loading navigation"
          className="mk-mobile-menu-trigger inline-block size-11"
        />
      }
    >
      <MobileDropdown {...props} />
    </Suspense>
  );
}
