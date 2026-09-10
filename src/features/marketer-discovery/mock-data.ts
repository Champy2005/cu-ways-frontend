// THROWAWAY FIXTURES — delete this whole file when the backend marketer
// endpoints land. Nothing outside src/features/marketers/api.ts may import it.
//
// Every number a teammate will compute on the backend (completed_jobs,
// average_rating, rating_count, in_progress_jobs) is a hard-coded literal here.
// Do not add filtering, sorting or aggregation logic to this file — that work is
// owned by the search/filter backend task, not by the UI.

import type {
  Marketer,
  MarketerQuery,
  MarketerSearchResult,
} from "@/features/marketer-discovery/types";

function packages(seed: number, titles: string[]): Marketer["service_packages"] {
  return titles.map((title, index) => ({
    package_id: seed * 10 + index,
    title,
    price_thb: 450 + index * 300 + seed * 25,
    published_at: `2025-1${index % 2}-${String(4 + index * 6).padStart(2, "0")}`,
  }));
}

function reviews(seed: number, comments: string[]): Marketer["reviews"] {
  return comments.map((comment, index) => ({
    review_id: seed * 10 + index,
    rating: 5 - (index % 2),
    comment,
    reviewer_name: ["Ms. Youtube Spotify", "Mr. Campus Daily", "Ms. Siam Review"][index % 3],
  }));
}

export const MOCK_MARKETERS: Marketer[] = [
  {
    marketer_id: 1,
    display_name: "Ms. Youtube Spotify",
    headline: "Biochemist",
    is_verified: true,
    average_rating: 4.8,
    rating_count: 22,
    phone: "088-8888888",
    email: "qwert@gmail.com",
    line_id: "qwertyuio.tt",
    bio: "Hi, my name is Ploy. I help campus teams turn survey ideas into responses that actually arrive, and I have run distribution for faculty research since 2023.",
    experience:
      "I specialize in reaching science and engineering students through faculty channels, club networks and lecture-hall partnerships. Past work covers food-service studies, wellbeing panels and course-feedback drives.",
    years_of_experience: 2,
    available_from: "2026-09-15",
    available_to: "2026-09-28",
    expertise: ["marketing", "data-scientist", "researcher"],
    campus_coverage: ["science", "engineering"],
    performance: {
      completed_jobs: 24,
      in_progress_jobs: 1,
      average_rating: 4.8,
      rating_count: 22,
    },
    service_packages: packages(1, [
      "Campus Food Survey",
      "Faculty Wellbeing Panel",
      "Course Feedback Drive",
      "Science Fair Intercepts",
    ]),
    reviews: reviews(1, [
      "Very professional !!!",
      "Delivered ahead of the deadline.",
      "Great reach across the science faculty.",
      "Clear reporting and quick replies.",
      "Would book again next semester.",
    ]),
  },
  {
    marketer_id: 2,
    display_name: "Mr. Kittipong R.",
    headline: "Product Manager",
    is_verified: true,
    average_rating: 4.5,
    rating_count: 14,
    phone: "081-2223344",
    email: "kittipong@example.com",
    line_id: "kitti.pm",
    bio: "Product manager by day, survey distribution partner for student startups after hours.",
    experience:
      "Six years shipping consumer products, three of them running research panels. Comfortable with screener design and quota management.",
    years_of_experience: 6,
    available_from: "2026-10-01",
    available_to: "2026-10-20",
    expertise: ["product-manager", "strategist", "analyst"],
    campus_coverage: ["engineering", "education"],
    performance: {
      completed_jobs: 41,
      in_progress_jobs: 2,
      average_rating: 4.5,
      rating_count: 14,
    },
    service_packages: packages(2, ["Startup Concept Test", "Quota-Managed Panel"]),
    reviews: reviews(2, ["Sharp screener design.", "Hit the quota with room to spare."]),
  },
  {
    marketer_id: 3,
    display_name: "Ms. Napat W.",
    headline: "Designer",
    is_verified: false,
    average_rating: 4.2,
    rating_count: 8,
    phone: null,
    email: "napat.w@example.com",
    line_id: "napat.design",
    bio: "Visual designer focused on making surveys people actually finish.",
    experience:
      "Four years in brand and campaign design for university societies, with a habit of rewriting question wording until the drop-off curve flattens.",
    years_of_experience: 4,
    available_from: "2026-09-08",
    available_to: "2026-09-30",
    expertise: ["designer", "marketing"],
    campus_coverage: ["arts"],
    performance: {
      completed_jobs: 12,
      in_progress_jobs: 0,
      average_rating: 4.2,
      rating_count: 8,
    },
    service_packages: packages(3, ["Arts Faculty Poster Run", "Survey Rewrite & Polish"]),
    reviews: reviews(3, ["Made the form feel effortless.", "Lovely posters."]),
  },
  {
    marketer_id: 4,
    display_name: "Mr. Anan S.",
    headline: "DevOps Engineer",
    is_verified: true,
    // Newly onboarded: drives the "No ratings yet" state end to end.
    average_rating: null,
    rating_count: 0,
    phone: "089-4445566",
    email: "anan.s@example.com",
    line_id: null,
    bio: "Just joined CU Ways. Infrastructure engineer helping technical societies run polls at scale.",
    experience:
      "Eight years in platform engineering. New to survey distribution, but well connected across the engineering faculty's technical clubs.",
    years_of_experience: 8,
    available_from: null,
    available_to: null,
    expertise: ["devops", "architect"],
    campus_coverage: ["engineering"],
    performance: {
      completed_jobs: 0,
      in_progress_jobs: 0,
      average_rating: null,
      rating_count: 0,
    },
    service_packages: packages(4, ["Engineering Club Blast"]),
    reviews: [],
  },
  {
    marketer_id: 5,
    display_name: "Ms. Pimchanok T.",
    headline: "Data Scientist",
    is_verified: true,
    average_rating: 4.9,
    rating_count: 31,
    phone: "086-7778899",
    email: "pim.t@example.com",
    line_id: "pim.data",
    bio: "I care about sample quality more than sample size.",
    experience:
      "Five years in analytics, specialising in weighting and non-response adjustment for small campus panels.",
    years_of_experience: 5,
    available_from: "2026-09-20",
    available_to: "2026-11-05",
    expertise: ["data-scientist", "analyst", "researcher"],
    campus_coverage: ["science", "education"],
    performance: {
      completed_jobs: 57,
      in_progress_jobs: 3,
      average_rating: 4.9,
      rating_count: 31,
    },
    service_packages: packages(5, [
      "Weighted Campus Panel",
      "Longitudinal Follow-up",
      "Non-response Audit",
    ]),
    reviews: reviews(5, [
      "The weighting notes alone were worth it.",
      "Caught a sampling bug we had missed.",
      "Excellent documentation.",
    ]),
  },
  {
    marketer_id: 6,
    display_name: "Mr. Chaiwat L.",
    headline: "Marketing Strategist",
    is_verified: false,
    average_rating: 3.9,
    rating_count: 5,
    phone: "082-1112233",
    email: "chaiwat.l@example.com",
    line_id: "chaiwat.m",
    bio: "Campaign strategist for student-run brands and faculty open days.",
    experience: "Three years running open-day campaigns across the arts and education faculties.",
    years_of_experience: 3,
    available_from: "2026-10-10",
    available_to: "2026-10-31",
    expertise: ["marketing", "strategist"],
    campus_coverage: ["arts", "education"],
    performance: {
      completed_jobs: 9,
      in_progress_jobs: 1,
      average_rating: 3.9,
      rating_count: 5,
    },
    service_packages: packages(6, ["Open Day Intercepts", "Society Newsletter Slot"]),
    reviews: reviews(6, ["Good value.", "Communication could be faster."]),
  },
];

/**
 * Display-only ordering so the rating sort control is visible while the backend
 * has no marketer endpoints. Unrated marketers sort last in BOTH directions —
 * treating "no rating" as zero would park them at the top of "low to high",
 * which reads as though they were rated badly.
 *
 * The real ordering belongs to the backend search task; this disappears with
 * the rest of this file at integration.
 */
function sortForDisplay(items: Marketer[], sort: MarketerQuery["sort"]): Marketer[] {
  if (sort !== "rating_asc" && sort !== "rating_desc") return items;

  const direction = sort === "rating_asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    if (a.average_rating === null || b.average_rating === null) {
      if (a.average_rating === b.average_rating) return 0;
      return a.average_rating === null ? 1 : -1;
    }
    return (a.average_rating - b.average_rating) * direction;
  });
}

/**
 * Stand-in for the backend search. Applies the keyword and the rating sort only,
 * so the US-013 empty state and the US-014 sort control are both reachable.
 * The remaining filters are the backend task's work and are not implemented here.
 */
export function selectMockMarketers(query: MarketerQuery): MarketerSearchResult {
  const keyword = query.q.trim().toLowerCase();
  const matched = keyword
    ? MOCK_MARKETERS.filter(
        (marketer) =>
          marketer.display_name.toLowerCase().includes(keyword) ||
          marketer.headline.toLowerCase().includes(keyword),
      )
    : MOCK_MARKETERS;

  const items = sortForDisplay(matched, query.sort);

  return {
    items: items.map((marketer) => ({
      marketer_id: marketer.marketer_id,
      display_name: marketer.display_name,
      headline: marketer.headline,
      is_verified: marketer.is_verified,
      average_rating: marketer.average_rating,
      rating_count: marketer.rating_count,
    })),
    total: items.length,
  };
}

export function findMockMarketer(marketerID: number): Marketer | null {
  return MOCK_MARKETERS.find((marketer) => marketer.marketer_id === marketerID) ?? null;
}
