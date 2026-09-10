import Link from "next/link";
import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { MarketerCard } from "@/features/marketer-discovery/components/marketer-card";
import { buildMarketerHref, hasActiveFilters } from "@/features/marketer-discovery/schemas";
import type { MarketerQuery, MarketerSummary } from "@/features/marketer-discovery/types";

type MarketerListProps = {
  marketers: MarketerSummary[];
  query: MarketerQuery;
};

function emptyStateCopy(query: MarketerQuery): { title: string; description: string } {
  if (query.q && hasActiveFilters(query)) {
    return {
      title: `No marketers match “${query.q}” with these filters`,
      description: "Try a different keyword, or remove a filter or two to widen the search.",
    };
  }
  if (query.q) {
    return {
      title: `No marketers match “${query.q}”`,
      description:
        "Check the spelling, or search for a service or area of expertise instead of a name.",
    };
  }
  if (hasActiveFilters(query)) {
    return {
      title: "No marketers match these filters",
      description: "Nobody meets every active filter. Removing one should bring results back.",
    };
  }
  return {
    title: "No marketers yet",
    description: "Marketers will appear here once they publish a profile and a service listing.",
  };
}

export function MarketerList({ marketers, query }: MarketerListProps) {
  if (marketers.length === 0) {
    const { title, description } = emptyStateCopy(query);
    const showReset = query.q !== "" || hasActiveFilters(query);

    return (
      <EmptyState
        title={title}
        description={description}
        icon={<SearchX className="size-6" aria-hidden="true" />}
        action={
          showReset ? (
            <Link href="/marketers" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Clear search and filters
            </Link>
          ) : null
        }
      />
    );
  }

  return (
    <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {marketers.map((marketer) => (
        <li key={marketer.marketer_id}>
          <MarketerCard marketer={marketer} href={buildMarketerHref(marketer.marketer_id, query)} />
        </li>
      ))}
    </ul>
  );
}
