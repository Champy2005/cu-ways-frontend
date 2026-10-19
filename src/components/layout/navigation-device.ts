import { userAgentFromString } from "next/server";

export type NavigationDevice = "desktop" | "mobile";

/** A presentation choice, never an authorization or permission check. */
export function navigationDevice(agent: string | null): NavigationDevice {
  const { device } = userAgentFromString(agent ?? "");
  return device.type === "mobile" || device.type === "tablet" ? "mobile" : "desktop";
}
