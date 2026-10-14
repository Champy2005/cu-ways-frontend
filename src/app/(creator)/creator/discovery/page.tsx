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

export default async function CreatorDiscoveryPage({
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
    </div>
  );
}
