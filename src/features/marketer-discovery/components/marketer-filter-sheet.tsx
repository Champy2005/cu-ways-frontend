"use client";

import { ArrowDownWideNarrow, ArrowUpNarrowWide, X } from "lucide-react";

import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { FilterChip } from "@/features/marketer-discovery/components/filter-chip";
import {
  AVAILABILITY_OPTIONS,
  CAMPUS_OPTIONS,
  EXPERIENCE_BOUNDS,
  EXPERTISE_OPTIONS,
  PRICE_BOUNDS,
  RATING_SORT_OPTIONS,
} from "@/features/marketer-discovery/constants";
import { formatBaht } from "@/features/marketer-discovery/format";
import type { MarketerQuery } from "@/features/marketer-discovery/types";

type MarketerFilterSheetProps = {
  open: boolean;
  draft: MarketerQuery;
  onDraftChange: (next: MarketerQuery) => void;
  onApply: () => void;
  onClear: () => void;
  onOpenChange: (open: boolean) => void;
};

type Option = { value: string; label: string };

// The backend combines selected expertise and campus values with AND.
const MATCH_ALL_HINT = "Marketers must match every option you select.";

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function ChipGroup({
  legend,
  options,
  selected,
  onChange,
}: {
  legend: string;
  options: Option[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-1 text-lg font-medium text-foreground">{legend}</legend>
      <p className="mb-3 text-xs text-muted-foreground">{MATCH_ALL_HINT}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            selected={selected.includes(option.value)}
            onToggle={() => onChange(toggleValue(selected, option.value))}
          />
        ))}
      </div>
    </fieldset>
  );
}

export function MarketerFilterSheet({
  open,
  draft,
  onDraftChange,
  onApply,
  onClear,
  onOpenChange,
}: MarketerFilterSheetProps) {
  const priceRange: number[] = [
    draft.minPrice ?? PRICE_BOUNDS.min,
    draft.maxPrice ?? PRICE_BOUNDS.max,
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-6">
        <div className="mb-6 flex items-start justify-between">
          <DialogTitle>Marketers Filter</DialogTitle>
          <DialogClose
            aria-label="Close filters"
            className="flex size-8 items-center justify-center rounded-full text-muted-strong outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <X className="size-5" aria-hidden="true" />
          </DialogClose>
        </div>

        <div className="flex flex-col gap-6">
          <ChipGroup
            legend="Expertise"
            options={EXPERTISE_OPTIONS}
            selected={draft.expertise}
            onChange={(expertise) => onDraftChange({ ...draft, expertise })}
          />
          <ChipGroup
            legend="Campus Coverage"
            options={CAMPUS_OPTIONS}
            selected={draft.campus}
            onChange={(campus) => onDraftChange({ ...draft, campus })}
          />

          <fieldset>
            <legend className="mb-3 text-lg font-medium text-foreground">Rating</legend>
            <div className="flex flex-wrap gap-2">
              {RATING_SORT_OPTIONS.map((option) => {
                const selected = draft.sort === option.value;
                return (
                  <FilterChip
                    key={option.value}
                    label={
                      <>
                        {option.value === "rating_desc" ? (
                          <ArrowDownWideNarrow className="size-3.5" aria-hidden="true" />
                        ) : (
                          <ArrowUpNarrowWide className="size-3.5" aria-hidden="true" />
                        )}
                        {option.label}
                      </>
                    }
                    selected={selected}
                    // Re-selecting the active direction clears the sort entirely.
                    onToggle={() =>
                      onDraftChange({ ...draft, sort: selected ? null : option.value })
                    }
                  />
                );
              })}
            </div>
          </fieldset>

          <div>
            <label
              htmlFor="marketer-experience"
              className="mb-3 block text-lg font-medium text-foreground"
            >
              Experience <span className="text-sm text-muted-foreground">(Years)</span>
            </label>
            <Input
              id="marketer-experience"
              type="number"
              inputMode="numeric"
              min={EXPERIENCE_BOUNDS.min}
              max={EXPERIENCE_BOUNDS.max}
              placeholder="Minimum"
              value={draft.experience ?? ""}
              onChange={(event) =>
                onDraftChange({
                  ...draft,
                  experience: event.target.value === "" ? null : Number(event.target.value),
                })
              }
              className="rounded-none border-0 border-b border-input px-0"
            />
          </div>

          <div>
            <p className="mb-1 text-lg font-medium text-foreground">Price Range</p>
            <div className="flex justify-center gap-10 text-sm text-foreground">
              <span>{formatBaht(priceRange[0] ?? PRICE_BOUNDS.min)}</span>
              <span>{formatBaht(priceRange[1] ?? PRICE_BOUNDS.max)}</span>
            </div>
            <Slider
              value={priceRange}
              min={PRICE_BOUNDS.min}
              max={PRICE_BOUNDS.max}
              step={10}
              thumbLabels={["Minimum price", "Maximum price"]}
              onValueChange={(next) => {
                const [min, max] = Array.isArray(next) ? next : [next, next];
                onDraftChange({
                  ...draft,
                  // A handle left at its bound means "no limit", so it is not sent.
                  minPrice: min === undefined || min <= PRICE_BOUNDS.min ? null : min,
                  maxPrice: max === undefined || max >= PRICE_BOUNDS.max ? null : max,
                });
              }}
            />
          </div>

          <fieldset>
            <legend className="mb-3 text-lg font-medium text-foreground">Availability</legend>
            <div className="flex flex-wrap gap-2">
              {AVAILABILITY_OPTIONS.map((option) => {
                const selected = draft.availability === option.value;
                return (
                  <FilterChip
                    key={option.value}
                    label={option.label}
                    selected={selected}
                    onToggle={() =>
                      onDraftChange({ ...draft, availability: selected ? null : option.value })
                    }
                  />
                );
              })}
            </div>
          </fieldset>
        </div>

        <div className="sticky bottom-0 z-10 -mx-6 mt-8 flex gap-3 border-t border-border bg-background px-6 py-4">
          <Button variant="outline" size="lg" className="flex-1" onClick={onClear}>
            Clear all
          </Button>
          <Button
            size="lg"
            className="flex-1 bg-brand text-brand-foreground hover:bg-brand/90"
            onClick={onApply}
          >
            Show results
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
