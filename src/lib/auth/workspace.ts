export const WORKSPACE_COOKIE = "cuways_workspace";

export function safeReturnPath(value: string | null): string | null {
  if (!value || value.includes("\\") || /[\u0000-\u0020]/.test(value)) return null;
  return /^\/(creator|marketer|marketers|surveys|jobs|profile|dashboard|admin)(\/|\?|$)/.test(value)
    ? value
    : null;
}
