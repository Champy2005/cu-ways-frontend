import { SEARCH_PAGE_SIZE } from "@/features/marketer-discovery/constants";
import type {
  Marketer,
  MarketerQuery,
  MarketerSearchItem,
  MarketerSearchParams,
  MarketerSummary,
  ServicePackage,
} from "@/features/marketer-discovery/types";

/**
 * Discovery URL state -> GET /api/v1/marketers query string. The backend reads
 * repeated keys for multi-value filters (expertise=a&expertise=b), so lists are
 * appended one value at a time rather than comma-joined as in our own URLs.
 * The keyword is deliberately not sent: the backend has no keyword parameter.
 */
export function toBackendSearchParams(
  query: MarketerQuery,
  pageSize: number = SEARCH_PAGE_SIZE,
): URLSearchParams {
  const params = new URLSearchParams();
  // Keys are checked against the generated contract, so a backend rename fails typecheck.
  const add = (key: keyof MarketerSearchParams, value: string | number) =>
    params.append(key, String(value));

  add("page_size", pageSize);
  query.expertise.forEach((slug) => add("expertise", slug));
  query.campus.forEach((slug) => add("campus", slug));
  if (query.experience !== null) add("min_experience_years", query.experience);
  if (query.minPrice !== null) add("min_price", query.minPrice);
  if (query.maxPrice !== null) add("max_price", query.maxPrice);
  if (query.availability !== null) add("availability_status", query.availability);
  if (query.sort !== null) add("sort", query.sort);
  return params;
}

function headlineFor(item: MarketerSearchItem): string {
  const areas = item.profile.expertise.map((option) => option.name);
  return areas.length > 0 ? areas.join(" · ") : "Survey marketer";
}

function experienceFor(item: MarketerSearchItem): string {
  const years = item.profile.experience_years;
  const span = years === 1 ? "1 year" : `${years} years`;
  const areas = item.profile.expertise.map((option) => option.name);
  return areas.length > 0
    ? `${span} of experience in ${areas.join(", ")}.`
    : `${span} of experience.`;
}

function toPackage(service: MarketerSearchItem["services"][number]): ServicePackage {
  return {
    package_id: service.service_id,
    title: service.service_type,
    price_thb: Number(service.price),
    published_at: service.created_at.slice(0, 10),
  };
}

export function toMarketerSummary(item: MarketerSearchItem): MarketerSummary {
  return {
    marketer_id: item.profile.user_id,
    display_name: item.profile.name,
    headline: headlineFor(item),
    // The backend has no verification field; show no badge rather than invent one.
    is_verified: false,
    average_rating: item.average_rating ?? null,
    rating_count: item.review_count,
  };
}

export function toMarketer(item: MarketerSearchItem): Marketer {
  const newestFirst = [...item.services].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return {
    ...toMarketerSummary(item),
    phone: item.profile.phone,
    email: item.profile.email,
    line_id: item.profile.line_id,
    bio: item.profile.bio,
    experience: experienceFor(item),
    years_of_experience: item.profile.experience_years,
    availability_status: item.profile.availability_status,
    availability_text: item.profile.availability_text,
    expertise: item.profile.expertise.map((option) => option.name),
    campuses: item.profile.campuses.map((option) => option.name),
    performance: {
      // Job counts only come from /me/statistics, which is limited to the marketer themself.
      completed_jobs: null,
      in_progress_jobs: null,
      average_rating: item.average_rating ?? null,
      rating_count: item.review_count,
    },
    service_packages: newestFirst.map(toPackage),
    // No backend endpoint returns individual reviews yet.
    reviews: [],
  };
}
