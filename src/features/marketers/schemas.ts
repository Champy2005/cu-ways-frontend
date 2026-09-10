import {
  CAMPUS_OPTIONS,
  EXPERIENCE_BOUNDS,
  EXPERTISE_OPTIONS,
  PRICE_BOUNDS,
  SORT_OPTIONS,
} from "@/features/marketers/constants";
import type { MarketerQuery, MarketerSortOption } from "@/features/marketers/types";

export type RawSearchParams = Record<string, string | string[] | undefined>;

const EXPERTISE_VALUES = EXPERTISE_OPTIONS.map((option) => option.value);
const CAMPUS_VALUES = CAMPUS_OPTIONS.map((option) => option.value);
const SORT_VALUES = SORT_OPTIONS.map((option) => option.value);

const DISCOVERY_PATH = "/marketers";
const MAX_KEYWORD_LENGTH = 100;

export const EMPTY_MARKETER_QUERY: MarketerQuery = {
  q: "",
  expertise: [],
  campus: [],
  experience: null,
  minPrice: null,
  maxPrice: null,
  from: null,
  to: null,
  sort: null,
};

function firstValue(raw: string | string[] | undefined): string {
  if (Array.isArray(raw)) return raw[0] ?? "";
  return raw ?? "";
}

function parseList(raw: string | string[] | undefined, allowed: string[]): string[] {
  const parts = firstValue(raw)
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter((part) => allowed.includes(part));
  return [...new Set(parts)];
}

function parseInteger(raw: string | string[] | undefined, min: number, max: number): number | null {
  const value = Number(firstValue(raw));
  if (!Number.isFinite(value) || firstValue(raw).trim() === "") return null;
  return Math.min(Math.max(Math.trunc(value), min), max);
}

function parseIsoDate(raw: string | string[] | undefined): string | null {
  const value = firstValue(raw).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return Number.isNaN(Date.parse(value)) ? null : value;
}

function parseSort(raw: string | string[] | undefined): MarketerSortOption | null {
  const value = firstValue(raw).trim();
  return SORT_VALUES.includes(value as MarketerSortOption) ? (value as MarketerSortOption) : null;
}

function toRecord(input: RawSearchParams | URLSearchParams): RawSearchParams {
  if (!(input instanceof URLSearchParams)) return input;
  const record: RawSearchParams = {};
  for (const key of new Set(input.keys())) {
    record[key] = input.getAll(key);
  }
  return record;
}

/**
 * Total by construction: never throws, drops unknown values, clamps out-of-range
 * numbers, and normalizes an inverted price range. Safe on hand-edited URLs.
 */
export function parseMarketerQuery(input: RawSearchParams | URLSearchParams): MarketerQuery {
  const params = toRecord(input);

  const minPrice = parseInteger(params.min, PRICE_BOUNDS.min, PRICE_BOUNDS.max);
  const maxPrice = parseInteger(params.max, PRICE_BOUNDS.min, PRICE_BOUNDS.max);
  const swap = minPrice !== null && maxPrice !== null && minPrice > maxPrice;

  const from = parseIsoDate(params.from);
  const to = parseIsoDate(params.to);
  const swapDates = from !== null && to !== null && from > to;

  return {
    q: firstValue(params.q).trim().slice(0, MAX_KEYWORD_LENGTH),
    expertise: parseList(params.expertise, EXPERTISE_VALUES),
    campus: parseList(params.campus, CAMPUS_VALUES),
    experience: parseInteger(params.exp, EXPERIENCE_BOUNDS.min, EXPERIENCE_BOUNDS.max),
    minPrice: swap ? maxPrice : minPrice,
    maxPrice: swap ? minPrice : maxPrice,
    from: swapDates ? to : from,
    to: swapDates ? from : to,
    sort: parseSort(params.sort),
  };
}

/** Emits a canonical, stable key order and omits everything at its default. */
export function serializeMarketerQuery(query: MarketerQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.expertise.length > 0) params.set("expertise", query.expertise.join(","));
  if (query.campus.length > 0) params.set("campus", query.campus.join(","));
  if (query.experience !== null) params.set("exp", String(query.experience));
  if (query.minPrice !== null) params.set("min", String(query.minPrice));
  if (query.maxPrice !== null) params.set("max", String(query.maxPrice));
  if (query.from !== null) params.set("from", query.from);
  if (query.to !== null) params.set("to", query.to);
  if (query.sort !== null) params.set("sort", query.sort);
  return params.toString();
}

export function isEmptyMarketerQuery(query: MarketerQuery): boolean {
  return serializeMarketerQuery(query) === "";
}

export function hasActiveFilters(query: MarketerQuery): boolean {
  return serializeMarketerQuery({ ...query, q: "" }) !== "";
}

export type FilterChip = {
  key: keyof MarketerQuery;
  label: string;
};

function labelFor(options: { value: string; label: string }[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

/** One chip per active filter, in the order the filter sheet presents them. */
export function activeFilterChips(query: MarketerQuery): FilterChip[] {
  const chips: FilterChip[] = [];

  for (const value of query.expertise) {
    chips.push({ key: "expertise", label: labelFor(EXPERTISE_OPTIONS, value) });
  }
  for (const value of query.campus) {
    chips.push({ key: "campus", label: labelFor(CAMPUS_OPTIONS, value) });
  }
  if (query.experience !== null) {
    chips.push({ key: "experience", label: `${query.experience}+ years` });
  }
  if (query.minPrice !== null || query.maxPrice !== null) {
    chips.push({ key: "minPrice", label: "Price Range" });
  }
  if (query.from !== null || query.to !== null) {
    chips.push({ key: "from", label: "Availability" });
  }
  if (query.sort !== null) {
    chips.push({ key: "sort", label: labelFor(SORT_OPTIONS, query.sort) });
  }

  return chips;
}

/** Clears one chip's underlying filter, leaving every other filter intact. */
export function removeFilter(query: MarketerQuery, chip: FilterChip): MarketerQuery {
  switch (chip.key) {
    case "expertise":
      return {
        ...query,
        expertise: query.expertise.filter(
          (value) => labelFor(EXPERTISE_OPTIONS, value) !== chip.label,
        ),
      };
    case "campus":
      return {
        ...query,
        campus: query.campus.filter((value) => labelFor(CAMPUS_OPTIONS, value) !== chip.label),
      };
    case "experience":
      return { ...query, experience: null };
    case "minPrice":
      return { ...query, minPrice: null, maxPrice: null };
    case "from":
      return { ...query, from: null, to: null };
    case "sort":
      return { ...query, sort: null };
    default:
      return query;
  }
}

/** Discovery URL, carrying the current query so it can be restored later. */
export function buildDiscoveryHref(query: MarketerQuery): string {
  const search = serializeMarketerQuery(query);
  return search ? `${DISCOVERY_PATH}?${search}` : DISCOVERY_PATH;
}

/** Marketer link that stashes the discovery query in a single opaque `ref` param. */
export function buildMarketerHref(marketerID: number, query: MarketerQuery): string {
  const search = serializeMarketerQuery(query);
  const base = `${DISCOVERY_PATH}/${marketerID}`;
  return search ? `${base}?ref=${encodeURIComponent(search)}` : base;
}

/** Profile link that forwards an existing `ref` so the discovery trail survives. */
export function buildMarketerHrefFromRef(
  marketerID: number,
  ref: string | string[] | undefined,
): string {
  const value = firstValue(ref);
  const base = `${DISCOVERY_PATH}/${marketerID}`;
  return value ? `${base}?ref=${encodeURIComponent(value)}` : base;
}

/** Sub-page link that forwards `ref` untouched so the trail survives one more hop. */
export function buildMarketerSubPageHref(
  marketerID: number,
  segment: string,
  ref: string | string[] | undefined,
): string {
  const value = firstValue(ref);
  const base = `${DISCOVERY_PATH}/${marketerID}/${segment}`;
  return value ? `${base}?ref=${encodeURIComponent(value)}` : base;
}

/**
 * Rebuilds the discovery URL from an untrusted `ref`. The result is always
 * reconstructed from the allowlisted keys above and always prefixed with
 * `/marketers`, so a hostile `ref` can never redirect off-route or off-site.
 */
export function buildBackHref(ref: string | string[] | undefined): string {
  return buildDiscoveryHref(parseMarketerQuery(new URLSearchParams(firstValue(ref))));
}

export function refParam(ref: string | string[] | undefined): string {
  return firstValue(ref);
}
