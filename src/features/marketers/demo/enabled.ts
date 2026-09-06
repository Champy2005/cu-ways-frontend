// Server-only: never expose this flag through NEXT_PUBLIC_* or client props.
export function isMarketerDemoEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.MARKETER_DEMO_ENABLED === "true";
}
