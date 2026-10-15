# Invitations and custom offers (US20 / US21)

## Live workflow

`/marketer/invitations` lists the authenticated marketer's received requests. Pending and Responded
tabs support search by job ID, survey title, and creator. Accept/decline confirmations persist the
response and backend timestamp. Accepting signals interest; it does not hire the marketer.
Declines support the backend's optional reason and 300-character note.

The empty/search state uses the same gray mascot, spacing, text and clear-search action as the
demo. Touch users refresh by pulling down and releasing at the top of the invitation list.
An indicator appears only during the gesture/loading; short, sideways, upward, cancelled and
multi-touch gestures do not refresh. Normal scrolling below the top is unaffected. No permanent
refresh button/panel appears on either healthy live screen. Actual failures expose a small retry
action, while success feedback uses the existing toast.

`/marketer/offer/create?requestId=<positive-int32>` loads the owned invitation and current offer.
Initial submission requires an Accepted request, a Pending job, and a successfully loaded empty
offer list. Price is a decimal string from 0 to 99999999.99 with up to two fractional digits.
Delivery is required, using today's Bangkok calendar date and the earliest survey deadline when
one exists. The optional message is limited to 300 Unicode code points after trimming, like the
backend. An elapsed job deadline prevents new submission.

All existing offers are read-only, including Accepted/Rejected/Withdrawn records and offers for
Closed requests. US24 withdrawal and replacement submission are deliberately excluded. The backend
already supports replacement eligibility, but this frontend release does not expose that action.

The live UI derives its heading from the linked survey title (first title plus a count for multiple
surveys), with Job #ID underneath. Deadline and Target are the only two tags. Compact survey
summaries expand through a keyboard-accessible details disclosure; metadata and safe external URLs
remain available there. Invitation statuses appear near the actions as Awaiting your response,
Invitation accepted, Invitation declined, or Invitation closed. Job lifecycle status is used for
eligibility and contextual explanations, rather than a competing status tag. Offer views emphasize
the offer status; an accepted offer explicitly means the marketer has been hired. Saved offers show
read-only values, and creation fields show validation on blur while preserving drafts.

The live UI has no separate stored job title, creator budget, or creator invitation message. Missing optional
data is shown as Not specified; a missing brief is shown as No brief attached. Only HTTP(S) external
links are rendered, with new-tab isolation. The marketer's optional offer message remains supported.

## Integration boundary

The `live/` feature uses generated backend types, runtime response validation, server reads, and
same-origin BFF mutations. JWTs remain in the existing HttpOnly session boundary. Browser mutations
require the configured frontend origin. The backend remains authoritative for membership,
ownership, state transitions and persistence.

| Backend endpoint                          | Frontend usage                              |
| ----------------------------------------- | ------------------------------------------- |
| GET /api/v1/me/job-requests               | Initial server reads and refresh snapshots  |
| POST /api/v1/me/job-requests/{id}/accept  | POST /api/job-requests/{id}/accept          |
| POST /api/v1/me/job-requests/{id}/decline | POST /api/job-requests/{id}/decline         |
| GET /api/v1/me/job-requests/{id}/offers   | Parallel reads for Accepted/Closed requests |
| POST /api/v1/me/job-requests/{id}/offers  | POST /api/job-requests/{id}/offers          |

GET `/api/job-requests`, optionally with `requestId`, supplies uncached refresh snapshots using the
same server loader. Offer lookup failures are distinct from an empty list and prevent submission.
Confirmed mutation responses update local state before refreshing authoritative data. If that
refresh fails, the UI says the change was saved and blocks further mutations until a successful
refresh. A partial offer-lookup failure also counts as a failed refresh: known saved offers stay
visible and read-only, and the saved warning remains through unsuccessful retries. Successful
invitation refreshes update relative invitation ages against the current time.
Conflicts refresh status without claiming success; failed submissions preserve drafts.
Duplicate clicks are blocked while requests are pending.

## Existing fictional preview

The existing demo is unchanged. Enable `MARKETER_DEMO_ENABLED=true` locally and visit
`/demo/marketer?view=invitations` or `/demo/marketer?view=offer&requestId=request-063`.
It uses a fixed 7 October 2026 clock, session-storage fixtures, fictional briefs and preview-only
fields/actions. Its final-withdrawal rule is legacy preview behavior, not the US24 contract.
It never calls the backend and is always disabled in production. Live modules never import its store.

## Verification

### Manual testing before Creator setup screens exist

With the existing migrated backend running locally, run `pnpm setup:us2021` and then `pnpm dev`.
The frontend-owned script calls only existing APIs and restricts its target to loopback URLs.
It creates fresh synthetic Creator/Marketer accounts and four invitation scenarios (two Pending,
one Accepted without an offer, one Accepted with a saved Pending offer), plus an empty-inbox
Marketer. Login credentials and job/request IDs are saved to the printed path under ignored
`.artifacts/manual-us2021/`; no tokens are written to disk and passwords are not printed to logs.
Each run creates a new credential file and leaves existing accounts and records unchanged.
Use the `marketer`, `emptyMarketer`, or `creator` login details from that file in the normal app.
The sample external links use `example.test` and are intentionally placeholders in the test data.
Set `BACKEND_API_URL` to override the default `http://127.0.0.1:8081`.

### Automated checks

Run `pnpm generate:api:check`, `pnpm check`, and `pnpm test:e2e` for contract freshness, frontend
gates, and existing production public browser checks. Focused tests under `live/` cover API and
origin/session boundaries, malformed responses, optional fields, Unicode/date/price validation,
conflicts, duplicate prevention, read-only offers, failed lookup/refresh, and draft preservation.
Gesture tests verify the release threshold, top-of-scroll requirement, cancellation, input targets,
multi-touch rejection and single-flight behavior. The live mobile browser check dispatches real
touch input and proves a newly created invitation appears without reloading the document.

For real persistence evidence, start the existing migrated local backend and PostgreSQL, then run:

```powershell
pnpm build
pnpm exec playwright test --config=playwright.live.config.ts
```

The separate opt-in suite runs the production frontend on port 3102 with the demo disabled and
uses the backend at `http://127.0.0.1:8081` (`LIVE_BACKEND_API_URL` can override to another loopback
development URL). It creates uniquely named synthetic creator/marketer accounts, surveys, jobs,
briefs and invitations through existing APIs, then logs in through the actual UI. Desktop/mobile
checks exercise accept, submit, reload, decline, empty inbox and another marketer's isolation, with
backend reads confirming saved values. Fixture records remain as synthetic local development data;
the suite never deletes unrelated records. No database or backend-code changes are required.

Authenticated traces/video are disabled to avoid recording credentials and tokens; failure
screenshots contain synthetic account data only. Reports stay in ignored `.artifacts/verification/`.
No mocked/demo test or build alone establishes backend persistence. Missing runtime evidence must
be reported as incomplete, not a pass.

Existing demo regression command: `pnpm exec playwright test --config=playwright.demo.config.ts`.
Set `PLAYWRIGHT_CHANNEL=msedge` if using installed Edge instead of bundled Chromium. On restricted
Windows hosts, point TEMP/TMP and `PWTEST_CACHE_DIR` to owned ignored directories under `.artifacts`.
