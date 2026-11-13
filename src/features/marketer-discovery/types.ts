import type { components, operations } from "@/lib/api/generated/backend";

// Backend contract, generated from cu-ways-backend dev (docs/openapi.yaml).
export type MarketerSearchItem = components["schemas"]["MarketerSearchItem"];
export type MarketerSearchPage = components["schemas"]["MarketerSearchResponse"]["data"];
export type MarketerSearchParams = NonNullable<
  operations["searchMarketers"]["parameters"]["query"]
>;
export type AvailabilityStatus = components["schemas"]["MarketerProfile"]["availability_status"];
export type MarketerReviewsPage = components["schemas"]["MarketerReviewsResponse"]["data"];
export type MarketerReviewItem = MarketerReviewsPage["items"][number];

// View models the discovery components render, mapped from the contract in
// mapping.ts. Fields the backend has no source for are null or empty rather
// than invented.

export type MarketerSummary = {
  marketer_id: number;
  display_name: string;
  headline: string;
  is_verified: boolean;
  average_rating: number | null;
  rating_count: number;
};

export type ServicePackage = {
  package_id: number;
  title: string;
  price_thb: number;
  published_at: string;
};

export type MarketerReview = {
  review_id: number;
  job_id: number;
  rating: number;
  /** Null when the Creator left only a rating. */
  comment: string | null;
  created_at: string;
  /** Null when the reviewer's stored name is blank. */
  reviewer_name: string | null;
};

/** Every qualifying review of one marketer, newest first, with the whole-set aggregates. */
export type MarketerReviewHistory = {
  reviews: MarketerReview[];
  average_rating: number | null;
  review_count: number;
  /** True when the marketer has more reviews than the page cap lets us load. */
  truncated: boolean;
};

export type MarketerPerformance = {
  completed_jobs: number | null;
  in_progress_jobs: number | null;
  average_rating: number | null;
  rating_count: number;
};

export type Marketer = MarketerSummary & {
  phone: string | null;
  email: string;
  line_id: string | null;
  bio: string;
  experience: string;
  years_of_experience: number | null;
  availability_status: AvailabilityStatus;
  availability_text: string;
  expertise: string[];
  campuses: string[];
  performance: MarketerPerformance;
  service_packages: ServicePackage[];
};

export type MarketerSortOption =
  "rating_asc" | "rating_desc" | "price_asc" | "price_desc" | "experience_desc";

export type MarketerQuery = {
  q: string;
  expertise: string[];
  campus: string[];
  experience: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  availability: AvailabilityStatus | null;
  minRating?: number | null;
  sort: MarketerSortOption | null;
};

export type MarketerSearchResult = {
  items: MarketerSummary[];
  total: number;
};
