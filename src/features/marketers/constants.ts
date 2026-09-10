import type { MarketerSortOption } from "@/features/marketers/types";

type Option = {
  value: string;
  label: string;
};

// Option tables drive both the filter sheet UI and the query parser, so an
// unknown slug in a hand-edited URL is rejected in exactly one place.
export const EXPERTISE_OPTIONS: Option[] = [
  { value: "designer", label: "Designer" },
  { value: "product-manager", label: "Product Manager" },
  { value: "marketing", label: "Marketing" },
  { value: "data-scientist", label: "Data Scientist" },
  { value: "devops", label: "DevOps" },
  { value: "architect", label: "Architect" },
  { value: "strategist", label: "Strategist" },
  { value: "analyst", label: "Analyst" },
  { value: "researcher", label: "Researcher" },
];

export const CAMPUS_OPTIONS: Option[] = [
  { value: "engineering", label: "Engineering" },
  { value: "science", label: "Science" },
  { value: "arts", label: "Arts" },
  { value: "education", label: "Education" },
];

type SortOption = { value: MarketerSortOption; label: string };

/** The two the filter sheet renders. Rating sorting is the only sort with a control today. */
export const RATING_SORT_OPTIONS: SortOption[] = [
  { value: "rating_desc", label: "Rating: high to low" },
  { value: "rating_asc", label: "Rating: low to high" },
];

/** Every sort the URL accepts, including ones no control produces yet. */
export const SORT_OPTIONS: SortOption[] = [
  ...RATING_SORT_OPTIONS,
  { value: "price_asc", label: "Lowest price" },
  { value: "price_desc", label: "Highest price" },
  { value: "experience_desc", label: "Most experience" },
];

export const PRICE_BOUNDS = { min: 0, max: 5000 } as const;
export const EXPERIENCE_BOUNDS = { min: 0, max: 50 } as const;

export const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
