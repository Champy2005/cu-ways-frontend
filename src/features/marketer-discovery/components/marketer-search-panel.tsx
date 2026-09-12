"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { FilterChip } from "@/features/marketer-discovery/components/filter-chip";
import { MarketerFilterSheet } from "@/features/marketer-discovery/components/marketer-filter-sheet";
import {
  activeFilterChips,
  buildDiscoveryHref,
  EMPTY_MARKETER_QUERY,
  removeFilter,
  type FilterChip as FilterChipData,
} from "@/features/marketer-discovery/schemas";
import type { MarketerQuery } from "@/features/marketer-discovery/types";

type MarketerSearchPanelProps = {
  query: MarketerQuery;
};

/**
 * The only stateful piece of discovery. Filter state lives in the URL — the page
 * parses it on the server and passes it in — so this component only ever writes.
 * That keeps the discovery page a Server Component and avoids useSearchParams
 * (and the Suspense boundary it would require) entirely.
 */
export function MarketerSearchPanel({ query }: MarketerSearchPanelProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState(query.q);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState(query);

  const chips = activeFilterChips(query);

  const commit = (next: MarketerQuery) => {
    router.push(buildDiscoveryHref(next), { scroll: false });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    commit({ ...query, q: keyword.trim() });
  };

  const handleRemoveChip = (chip: FilterChipData) => {
    const next = removeFilter(query, chip);
    setDraft(next);
    commit(next);
  };

  const openSheet = (open: boolean) => {
    if (open) setDraft(query);
    setSheetOpen(open);
  };

  return (
    <div className="mb-6 flex flex-col gap-3">
      <form onSubmit={handleSubmit} role="search">
        <label htmlFor="marketer-search" className="sr-only">
          Search marketers
        </label>
        <div className="relative">
          <Search
            className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="marketer-search"
            name="q"
            type="search"
            placeholder="Discovery Creator"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="h-10 rounded-full border-transparent bg-background pl-11 shadow-card"
          />
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip
          label={
            <>
              <ChevronDown className="size-3.5" aria-hidden="true" />
              Filter
            </>
          }
          selected={sheetOpen}
          onToggle={() => openSheet(true)}
        />
        {chips.map((chip) => (
          <FilterChip
            key={`${chip.key}-${chip.label}`}
            label={chip.label}
            selected
            onRemove={() => handleRemoveChip(chip)}
            removeLabel={`Remove ${chip.label} filter`}
          />
        ))}
      </div>

      <MarketerFilterSheet
        open={sheetOpen}
        draft={draft}
        onDraftChange={setDraft}
        onApply={() => {
          setSheetOpen(false);
          setKeyword(draft.q);
          commit(draft);
        }}
        onClear={() => {
          setSheetOpen(false);
          setKeyword("");
          commit(EMPTY_MARKETER_QUERY);
        }}
        onOpenChange={openSheet}
      />
    </div>
  );
}
