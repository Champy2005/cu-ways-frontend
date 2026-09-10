import { InlineError } from "@/components/feedback/inline-error";
import { listMarketers } from "@/features/marketers/api";
import { MarketerList } from "@/features/marketers/components/marketer-list";
import { MarketerPageHeader } from "@/features/marketers/components/marketer-page-header";
import { MarketerSearchPanel } from "@/features/marketers/components/marketer-search-panel";
import {
  parseMarketerQuery,
  serializeMarketerQuery,
  type RawSearchParams,
} from "@/features/marketers/schemas";
import { getDisplayError } from "@/lib/api/errors";

export default async function MarketersPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const query = parseMarketerQuery(await searchParams);

  let result;
  try {
    result = await listMarketers(query);
  } catch (error) {
    return <InlineError message={getDisplayError(error)} />;
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <MarketerPageHeader
        title="Marketer Discovery"
        subtitle="Search Marketer"
        backHref="/dashboard"
      />
      {/* Remounts on every query change so the inputs resync without an effect. */}
      <MarketerSearchPanel key={serializeMarketerQuery(query)} query={query} />
      <MarketerList marketers={result.items} query={query} />
    </div>
  );
}
