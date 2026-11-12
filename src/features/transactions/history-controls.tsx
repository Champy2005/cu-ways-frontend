"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/ui/search-field";
import { historyHref, normalizeKeyword } from "./history-url";
import type { Workspace } from "./types";

export function HistorySearch({ workspace, keyword }: { workspace: Workspace; keyword: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submitted = useRef(keyword);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (input.current && timer.current === null && keyword !== submitted.current) {
      input.current.value = keyword;
      submitted.current = keyword;
    }
  }, [keyword]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function search() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const next = normalizeKeyword(input.current?.value ?? "");
    if (next === submitted.current) return;
    submitted.current = next;
    startTransition(() => router.replace(historyHref(workspace, next), { scroll: false }));
  }

  return (
    <form
      action={historyHref(workspace)}
      aria-busy={pending}
      onSubmit={(event) => {
        event.preventDefault();
        search();
      }}
    >
      <SearchField
        ref={input}
        name="keyword"
        label="Search transactions by job, person or payment method"
        placeholder="Search job, person or payment method"
        defaultValue={keyword}
        onChange={() => {
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(search, 300);
        }}
      />
      {pending && (
        <p className="sr-only" role="status">
          Loading transactions…
        </p>
      )}
    </form>
  );
}

export function RetryButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      {pending ? "Trying again…" : "Try again"}
    </Button>
  );
}

export function HistoryPagination({
  workspace,
  keyword,
  page,
  pages,
}: {
  workspace: Workspace;
  keyword: string;
  page: number;
  pages: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const nextFocus = useRef<number | null>(null);

  useEffect(() => {
    if (nextFocus.current === page) {
      document.getElementById("transaction-results-heading")?.focus();
      nextFocus.current = null;
    }
  }, [page]);

  if (pages < 2) return null;

  function link(label: string, target: number) {
    if (target < 1 || target > pages)
      return (
        <Button variant="outline" disabled>
          {label}
        </Button>
      );
    const href = historyHref(workspace, keyword, target);
    return (
      <Link
        href={href}
        className="mk-secondary-button inline-flex min-h-12 items-center px-4"
        onNavigate={(event) => {
          event.preventDefault();
          if (pending) return;
          nextFocus.current = target;
          startTransition(() => router.push(href, { scroll: false }));
        }}
      >
        {label}
      </Link>
    );
  }

  return (
    <nav
      aria-label="Transaction pages"
      aria-busy={pending}
      className="mt-5 flex flex-wrap items-center justify-between gap-3"
    >
      {link("Previous", page - 1)}
      <span>
        Page {page} of {pages}
      </span>
      {link("Next", page + 1)}
    </nav>
  );
}
