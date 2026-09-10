// TEMPORARY DEVIATION from the house convention that feature types alias
// components["schemas"][...] from src/lib/api/generated/backend.ts.
// Verified 2026-09: cu-ways-backend/docs/openapi.yaml contains zero marketer
// definitions, so there is nothing to alias yet. Replace every type below with a
// generated alias once the backend contract exists — see the TODO in api.ts.
//
// Field names deliberately mirror the backend's snake_case style (see User:
// user_id, line_id, created_at) so the eventual swap does not rename call sites.
// Aggregates a teammate will compute are nullable from day one, because the UI
// already has to render the "No ratings yet" state.

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
  rating: number;
  comment: string;
  reviewer_name: string;
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
  available_from: string | null;
  available_to: string | null;
  expertise: string[];
  campus_coverage: string[];
  performance: MarketerPerformance;
  service_packages: ServicePackage[];
  reviews: MarketerReview[];
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
  from: string | null;
  to: string | null;
  sort: MarketerSortOption | null;
};

export type MarketerSearchResult = {
  items: MarketerSummary[];
  total: number;
};
