import Link from "next/link";

import { InlineError } from "@/components/feedback/inline-error";

import { getDisplayError } from "@/lib/api/errors";

import { listMarketers } from "@/features/marketer-discovery/api";

import { MarketerList } from "@/features/marketer-discovery/components/marketer-list";

import { MarketerPageHeader } from "@/features/marketer-discovery/components/marketer-page-header";

import { MarketerSearchPanel } from "@/features/marketer-discovery/components/marketer-search-panel";

import {
  parseMarketerQuery,
  buildDiscoveryHref,
  serializeMarketerQuery,
  type RawSearchParams,
} from "@/features/marketer-discovery/schemas";

import type { MarketerSummary } from "@/features/marketer-discovery/types";

export default async function CreatorDiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;

  const query = parseMarketerQuery(params);

  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;

  const page = rawPage && /^[1-9]\d{0,5}$/.test(rawPage) ? Number(rawPage) : 1;

  const pageHref = (next: number) => {
    const url = new URL(buildDiscoveryHref(query), "http://localhost");
    if (next > 1) url.searchParams.set("page", String(next));
    return `${url.pathname}${url.search}`;
  };

  let total = 0;

  let marketers: MarketerSummary[] = [];

  let errorMessage: string | null = null;

  try {
    const result = await listMarketers(query, page);

    marketers = result.items;

    total = result.total;
  } catch (error) {
    errorMessage = getDisplayError(error);
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <MarketerPageHeader
        title="Marketer Discovery"

        subtitle="Search Marketer"

        backHref="/creator/dashboard"
      />

      {/* Remounts on every query change so the inputs resync without an effect. */}

      <MarketerSearchPanel key={serializeMarketerQuery(query)} query={query} />

      {errorMessage === null ? (
        <MarketerList marketers={marketers} query={query} />
      ) : (
        <InlineError message={errorMessage} />
      )}

      {errorMessage === null && (
        <nav
          aria-label="Marketer result pages"
          className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm"
        >
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="mk-secondary-button px-4 py-3">
              Previous
            </Link>
          ) : (
            <span />
          )}

          <span className="text-[var(--mk-muted)]">
            Page {page} · {total} marketers
          </span>

          {page * 100 < total && (
            <Link href={pageHref(page + 1)} className="mk-secondary-button px-4 py-3">
              Next
            </Link>
          )}

          {page > 1 && marketers.length === 0 && (
            <Link href={pageHref(1)} className="text-[var(--mk-accent)] underline">
              Back to first page
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
