import type { JobOffersSnapshot } from "../offer-actions";
import type { JobOfferComparison } from "../types";

export const testJob = {
  job_id: 12,
  job_status: "Pending" as const,
  created_at: "2026-10-01T10:00:00Z",
  surveys: [{ survey_id: 41, title: "Campus mobility" }],
};

export function testOffer(offerId = 101): JobOfferComparison {
  return {
    offer_id: offerId,
    job_id: 12,
    job_request_id: offerId + 100,
    marketer_id: offerId + 200,
    offered_price: offerId === 101 ? "2500.50" : "1800.00",
    delivery_date: "2026-11-15",
    message: "Campus recruitment with daily progress updates.",
    offer_status: "Pending",
    created_at: "2026-10-18T10:00:00Z",
    marketer: {
      user_id: offerId + 200,
      name: offerId === 101 ? "Mali Research" : "New Marketer",
      email: "marketer@example.test",
      phone: null,
      line_id: null,
      bio: "Experienced field researcher.",
      experience_years: 3,
      availability_status: "available",
      availability_text: "Weekdays",
      expertise: [{ slug: "data-collection", name: "Data Collection" }],
      campuses: [{ slug: "cu-main-campus", name: "CU Main Campus" }],
      created_at: "2026-01-01T00:00:00Z",
    },
    rating: { average_rating: 4.8, review_count: 12, completed_jobs: 15, is_rated: true },
  };
}

export function acceptedSnapshot(): JobOffersSnapshot {
  return {
    job: { ...testJob, job_status: "Accepted" },
    offers: [
      { ...testOffer(), offer_status: "Accepted" },
      { ...testOffer(102), offer_status: "Rejected" },
    ],
  };
}
