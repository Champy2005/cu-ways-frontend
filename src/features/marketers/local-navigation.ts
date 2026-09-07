"use client";

import { useSyncExternalStore } from "react";
import type { MouseEvent } from "react";

const eventName = "cuways-marketer-navigation";
function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener(eventName, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(eventName, callback);
  };
}

export function setLocalQuery(key: string, value: string) {
  const url = new URL(window.location.href);
  url.searchParams.set(key, value);
  window.history.pushState(null, "", url);
  window.dispatchEvent(new Event(eventName));
}

export function useLocalQuery(key: string, initial: string) {
  return useSyncExternalStore(
    subscribe,
    () => new URLSearchParams(window.location.search).get(key) ?? initial,
    () => initial,
  );
}

export function navigateDemo(event: MouseEvent<HTMLAnchorElement>, view: string) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  event.preventDefault();
  setLocalQuery("view", view);
}
