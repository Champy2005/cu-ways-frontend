// GENERATED from ../model/scenarios.json by ../../stories/build.mjs.
export default {
  "schemaVersion": 1,
  "canonical": true,
  "story": "US-034",
  "title": "Marketer reviews",
  "role": "Profile visitor",
  "intro": "Ratings and feedback from verified completed jobs.",
  "source": {
    "workbook": "Backlog (3).xlsx",
    "acceptance": "Project Backlog row 35; Sprint Backlog III rows 98–100",
    "inspectedOn": "2026-10-29"
  },
  "criteria": [
    {
      "id": "US034-01",
      "source": "Project Backlog row 35; Sprint Backlog III rows 98–100",
      "requirement": "Show only reviews on Completed jobs where this marketer held the accepted offer."
    },
    {
      "id": "US034-02",
      "source": "Project Backlog row 35; Sprint Backlog III rows 98–100",
      "requirement": "Display a 1–5 rating, optional comment, created_at and linked job_id."
    },
    {
      "id": "US034-03",
      "source": "Project Backlog row 35; Sprint Backlog III rows 98–100",
      "requirement": "When no qualifying reviews exist, show No reviews yet / No ratings yet and no numeric zero average."
    },
    {
      "id": "US034-04",
      "source": "Project Backlog row 35; Sprint Backlog III rows 98–100",
      "requirement": "Keep loading and read errors distinct; support long comments, rating filters and pagination."
    }
  ],
  "outcomes": [
    [
      "success",
      "Read-only story · use read result"
    ]
  ],
  "scenarios": [
    {
      "id": "A01",
      "title": "Verified reviews",
      "trigger": "Open a marketer profile with qualifying reviews.",
      "expected": "Show average, count and verified cards from completed jobs."
    },
    {
      "id": "A02",
      "title": "No reviews yet",
      "trigger": "There are no qualifying reviews.",
      "expected": "Show No reviews yet and No ratings yet without a 0.00 average."
    },
    {
      "id": "A03",
      "title": "Rating-only reviews",
      "trigger": "Reviews have no written comments.",
      "expected": "Show rating, date and linked job without inventing a comment."
    },
    {
      "id": "A04",
      "title": "Long written review",
      "trigger": "A review contains long Unicode text.",
      "expected": "Show a bounded preview with native Read full review / Show less disclosure. Preserve the complete Unicode comment, author, date and rating; expansion survives appearance re-renders."
    },
    {
      "id": "A05",
      "title": "Next review page",
      "trigger": "Open a longer review history.",
      "expected": "Show bounded pagination and retain rating filter."
    },
    {
      "id": "B01",
      "title": "Nonqualifying records excluded",
      "trigger": "Fixture includes uncompleted, wrong-marketer and invalid-rating records.",
      "expected": "Exclude them from cards, count, average and distribution."
    },
    {
      "id": "B02",
      "title": "No matching rating",
      "trigger": "Filter to 1 star when no 1-star reviews exist.",
      "expected": "Keep the true overall rating, show a compact filter-specific empty state and Show all ratings reset. Omit redundant single-page pagination."
    },
    {
      "id": "R01",
      "title": "Reviews loading",
      "trigger": "Review read is pending.",
      "expected": "Do not invent a zero rating or empty review conclusion."
    },
    {
      "id": "R02",
      "title": "Reviews read failed",
      "trigger": "Cannot read verified records.",
      "expected": "Show retry and suppress the unavailable rating."
    },
    {
      "id": "R03",
      "title": "Profile unavailable",
      "trigger": "Profile access is denied.",
      "expected": "Show a generic unavailable state without review details."
    }
  ],
  "presentationDecisions": {
    "revision": "1.7.0",
    "source": "../../book/README.md",
    "principles": "../../book/PRINCIPLES.md",
    "precedence": "Current human UX/UI guidance supersedes older presentation defaults; domain prerequisites remain unchanged.",
    "loading": "Close presentation without claiming rollback; keep background result/reopen affordance, 12-second unknown/read recovery and a same-tab fictional operation journal. Never replay a write on return.",
    "pagination": "Omit Previous entirely on the first page and Next on the last page.",
    "copy": "Keep only meaningful consequences, validation, uncertainty and next steps; do not repeat a visible status.",
    "reviewFilter": "A committed rating selection applies immediately, resets page and focuses refreshed results; no redundant Apply button."
  }
};
