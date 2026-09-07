"use client";
import { lazy, Suspense, useSyncExternalStore } from "react";
const MobileDropdown = lazy(() => import("./marketer-mobile-dropdown"));
const query = "(min-width: 768px)";
function subscribe(callback: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
function isMobile() {
  return !window.matchMedia(query).matches;
}
const serverMobile = () => false;
function Placeholder() {
  return (
    <span aria-label="Loading navigation" className="mk-mobile-menu-trigger inline-block size-11" />
  );
}
/** The desktop shell does not download the mobile dropdown implementation. */
export function MarketerMobileMenu(props: { demo: boolean; initialView?: string }) {
  const mobile = useSyncExternalStore(subscribe, isMobile, serverMobile);
  if (!mobile) return <Placeholder />;
  return (
    <Suspense fallback={<Placeholder />}>
      <MobileDropdown {...props} />
    </Suspense>
  );
}
