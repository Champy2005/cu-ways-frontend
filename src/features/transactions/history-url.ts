import type { Workspace } from "./types";

type HistoryParams = { keyword?: string | string[]; page?: string | string[] };

export function normalizeKeyword(value: string) {
  return Array.from(value.trim()).slice(0, 100).join("");
}

export function readHistoryQuery({ keyword, page }: HistoryParams) {
  const raw = typeof page === "string" ? page : "";
  return {
    keyword: normalizeKeyword(typeof keyword === "string" ? keyword : ""),
    page: /^[1-9]\d{0,9}$/.test(raw) && Number(raw) <= 2_147_483_647 ? Number(raw) : 1,
  };
}

export function historyHref(workspace: Workspace, keyword = "", page = 1) {
  const query = new URLSearchParams();
  if (keyword) query.set("keyword", keyword);
  if (page > 1) query.set("page", String(page));
  const search = query.toString();
  return `/${workspace}/transactions${search ? `?${search}` : ""}`;
}
