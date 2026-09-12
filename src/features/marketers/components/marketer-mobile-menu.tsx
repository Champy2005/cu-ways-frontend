"use client";
import { lazy, Suspense } from "react";
import type { NavigationDevice } from "@/components/layout/navigation-device";
const MobileDropdown = lazy(() => import("./marketer-mobile-dropdown"));
/** CSS selects the compact trigger; device selection preserves the phone bottom bar. */
export function MarketerMobileMenu(props: {
  demo: boolean;
  initialView?: string;
  device: NavigationDevice;
}) {
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
