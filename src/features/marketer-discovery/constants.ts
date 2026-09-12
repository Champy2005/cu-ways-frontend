import type { AvailabilityStatus, MarketerSortOption } from "@/features/marketer-discovery/types";

type Option = {
  value: string;
  label: string;
};

// Slugs and names mirror the curated catalog seeded by the backend migration
// 000005_marketer_profiles. The backend has no endpoint that lists them, so a
// catalog change there must be mirrored here; an unknown slug matches nothing.
export const EXPERTISE_OPTIONS: Option[] = [
  { value: "survey-distribution", label: "Survey Distribution" },
  { value: "participant-recruitment", label: "Participant Recruitment" },
  { value: "data-collection", label: "Data Collection" },
  { value: "quantitative-analysis", label: "Quantitative Analysis" },
  { value: "qualitative-analysis", label: "Qualitative Analysis" },
  { value: "report-preparation", label: "Report Preparation" },
];

export const CAMPUS_OPTIONS: Option[] = [
  { value: "cu-main-campus", label: "CU Main Campus" },
  { value: "cu-health-sciences-campus", label: "CU Health Sciences Campus" },
  { value: "off-campus", label: "Off-campus" },
  { value: "online-remote", label: "Online / Remote" },
];

export const AVAILABILITY_OPTIONS: { value: AvailabilityStatus; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "limited", label: "Limited" },
  { value: "unavailable", label: "Unavailable" },
];

type SortOption = { value: MarketerSortOption; label: string };

/** The two the filter sheet renders. */
export const RATING_SORT_OPTIONS: SortOption[] = [
  { value: "rating_desc", label: "Rating: high to low" },
  { value: "rating_asc", label: "Rating: low to high" },
];

/** Every sort the URL accepts. The backend rejects experience_desc with a 422. */
export const SORT_OPTIONS: SortOption[] = [
  ...RATING_SORT_OPTIONS,
  { value: "price_asc", label: "Lowest price" },
  { value: "price_desc", label: "Highest price" },
  { value: "experience_desc", label: "Most experience" },
];

export const PRICE_BOUNDS = { min: 0, max: 5000 } as const;
/** Matches the backend's 0-80 check on marketers.experience_years. */
export const EXPERIENCE_BOUNDS = { min: 0, max: 80 } as const;
/** The backend's maximum page_size. Discovery shows a single page. */
export const SEARCH_PAGE_SIZE = 100;

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
