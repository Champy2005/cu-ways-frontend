import { Info } from "lucide-react";

import { InlineError } from "@/components/feedback/inline-error";
import { getDisplayError } from "@/lib/api/errors";
import { listMarketers } from "@/features/marketer-discovery/api";
import { MarketerList } from "@/features/marketer-discovery/components/marketer-list";
import { MarketerPageHeader } from "@/features/marketer-discovery/components/marketer-page-header";
import { MarketerSearchPanel } from "@/features/marketer-discovery/components/marketer-search-panel";
import {
  parseMarketerQuery,
  serializeMarketerQuery,
  type RawSearchParams,
} from "@/features/marketer-discovery/schemas";
import type { MarketerSummary } from "@/features/marketer-discovery/types";

export default async function MarketersPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const query = parseMarketerQuery(await searchParams);

  let marketers: MarketerSummary[] = [];
  let errorMessage: string | null = null;
  try {
    const result = await listMarketers(query);
    marketers = result.items;
  } catch (error) {
    errorMessage = getDisplayError(error);
  }

  // The keyword stays in the box but is not applied, so the list's empty state
  // must not claim that nothing matched it.
  const listQuery = { ...query, q: "" };

  return (
    <div className="mx-auto w-full max-w-5xl">
      <MarketerPageHeader
        title="Marketer Discovery"
        subtitle="Search Marketer"
        backHref="/dashboard"
      />
      {/* Remounts on every query change so the inputs resync without an effect. */}
      <MarketerSearchPanel key={serializeMarketerQuery(query)} query={query} />
      {query.q ? (
        <p
          role="status"
          className="mb-4 flex items-start gap-2 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground"
        >
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            Keyword search isn&apos;t supported by the backend yet, so &ldquo;{query.q}&rdquo; is
            not applied. Results match your filters only.
          </span>
        </p>
      ) : null}
      {errorMessage === null ? (
        <MarketerList marketers={marketers} query={listQuery} />
      ) : (
        <InlineError message={errorMessage} />
      )}
    </div>
  );
}
