# Requirements and boundaries

> **Current presentation authority · 1.6.0:** Read the [design book](../book/README.md), [human principles](../book/PRINCIPLES.md) and canonical [scenario model](model/scenarios.json). Older copy, layout and pending-dismissal descriptions below are retained research/provenance, not current presentation requirements. Current UI uses concise Contract/survey hierarchy and declarative bounded dialogs. Pending operations can dismiss/reopen with12-second unknown/read recovery; closing UI does not claim rollback. Offline Start opens feedback without a write. Domain eligibility, access and server-authority requirements still apply.

## Sources and authority

Original research request was plan-only. The user subsequently approved design production, local SVG exports and browser import into Figma. Both application repositories remain outside implementation scope. User explicitly selected inclusion of a minimal My Jobs list on 21 October 2026.

Workbook: `C:/Users/thana/Downloads/Backlog (3).xlsx`; Sprint Backlog III D16:L27 and Project Backlog C24:G26. Chp owns rows 16–18; frontend owner is Thn and backend owner is Hin. Workbook implementation/trigger descriptions are requirements to assess, not instructions to execute.

## Required outcome

1. Hired marketer finds an assigned job in My Jobs and opens its details.
2. For a valid Accepted job owned through the selected Accepted offer, Start job is available.
3. Start job opens a confirmation; cancellation performs no mutation.
4. Confirmation submits one start attempt. Only confirmed server state can display In Progress.
5. Rejection, stale state and unknown outcome have explicit recovery without accidental duplicate transitions.
6. The same information and business rules apply on desktop, phone and tablet, light/dark themes, keyboard and touch.

## Invariants

| Subject                       | Rule                                                                                                                                               |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Invitation acceptance         | Interest to submit an offer; never proof of hiring or start permission.                                                                            |
| Creator hiring (US-023)       | Pending job → Accepted; selected offer Accepted; competitors resolved.                                                                             |
| Start (US-025)                | Accepted job → In Progress, initiated only by the hired marketer.                                                                                  |
| Identity                      | Server derives actor from session/token and checks active marketer membership and accepted-offer ownership. Admin alone does not imply permission. |
| Related data                  | Starting does not replace accepted_offer_id, rewrite accepted price, or re-resolve offer/request statuses.                                         |
| Financial/proof prerequisites | No payment, proof upload or completed survey requirement is introduced for Start.                                                                  |
| Optional data                 | Null brief/deadline/target does not block an otherwise eligible start. Display useful missing-value copy.                                          |
| Deadline                      | A past deadline is informational for this story, not an invented expiry or start prohibition.                                                      |
| Unknown status/data           | No enabled mutation for an unrecognized status, missing job identity or unverified ownership/capability.                                           |
| Canonical status              | `In Progress`, with one internal space and no trailing space.                                                                                      |

## Eligibility table

| Viewer / authoritative job state                          | Start control      | Visible explanation                                                                                 |
| --------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------- |
| Hired marketer + Accepted + valid selected Accepted offer | Enabled            | Your offer was accepted. Start when you begin the campaign.                                         |
| Hired marketer + In Progress                              | Absent             | Work has started. No repeat start CTA.                                                              |
| Hired marketer + Completed / Cancelled                    | Absent             | Textual lifecycle badge and read-only overview. No review/payment/cancellation actions added here.  |
| Pending job / invitation Accepted only                    | Not in My Jobs     | Still part of invitation/offer flow. A direct stale link becomes unavailable after authorized read. |
| Creator-only viewer / no marketer membership              | Absent             | No-marketer-access page, link to workspace. No account-creation requirement invented.               |
| Different marketer / inaccessible or missing job          | Absent             | Generic unavailable page; do not expose job title, creator, offer or price.                         |
| Missing/inconsistent selected offer or unknown capability | Disabled or absent | Details could not be verified; Refresh job. No false status such as Cancelled.                      |
| Signed out / expired session                              | Absent             | Sign-in flow with safe internal return path.                                                        |

## New entry surface (authorized addition)

Proposed app routes: `/marketer/jobs` and `/marketer/jobs/[id]`. Navigation label **My Jobs**. Listing contains only jobs where the authenticated marketer owns the selected accepted offer; it is not an invitation inbox or public marketplace.

Minimal list: **Job #ID**, survey names, creator, lifecycle badge, agreed price, deadline, **View job**, status filter and pagination. The current job model has no campaign-title field; the Figma sample campaign title is not evidence of such a field. Default filter **Active jobs** (Accepted/In Progress); other values Accepted, In Progress, Completed, Cancelled, All my jobs. No free-text search, sorting editor, bulk actions, inline Start, messaging or financial history added. Order job ID descending within the selected filter; 20 items/page. Labels never claim chronological hiring order when no hired_at field exists.

## Excluded work

No proof upload (US-026), completion (US-027/031), creator cancellation (US-028), payment, reviews, offer editing/withdrawal, chat, notifications, global navigation redesign, migrations, seeding, actual start requests or Figma edits. The In Progress screen is a useful read-only status view; it does not show a working Upload proof or Complete job button ahead of those stories.

## Requirement conflict to reconcile

Old US-025 criteria couple setting accepted_offer_id on Pending with automatic In Progress, and mention `trg_sync_offer_status_after_job_accept`. This contradicts US-023's explicit Accepted intermediate state and US-025's own story. Current backend hiring already synchronizes statuses transactionally in Go; no matching trigger was found. Proposed interpretation: retain US-023 hiring and add explicit start; do not introduce a second status-sync mechanism merely because the old workbook names a trigger. This is an identified backlog correction, not an approved database change.
