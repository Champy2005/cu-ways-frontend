# Invitations and custom offers (US20 / US21)

The screens are interactive frontend previews. US23 (creator acceptance) is deferred until US22
is available. No invitation/offer backend endpoint has been published in the current OpenAPI file.
The live `/marketer/invitations` and `/marketer/offer/create` routes require a session and show an
unavailable state. They do not substitute fictional records for live data.

## Preview

Enable `MARKETER_DEMO_ENABLED=true` in local development and restart the server. Open
`/demo/marketer?view=invitations`. Offer screens use
`/demo/marketer?view=offer&requestId=request-063`; `request-074` has an existing offer.
The preview is disabled in production, even when the flag is set.

The preview stores its own versioned data under `cuways-job-invitations-demo-v1` in session storage.
It preserves edits across navigation and reloads, falls back to memory when storage is blocked,
and validates stored content before restoring it. Reset demo restores these fixtures and the
existing marketer fixtures without altering the theme. The reference clock is fixed at
7 October 2026, 19:00 Bangkok time. Displayed timestamps are demo values, not a live audit trail.
Briefs are local fictional previews; survey URLs are absent rather than fabricated.

## Required backend capabilities

These are capability requirements, not agreed HTTP paths or wire schemas:

- List invitations owned by the authenticated marketer, with job identifier/title, creator,
  invitation message and timestamp, budget, deadline, survey metadata/links, response target,
  brief information, request status, and response timestamp.
- Accept or decline a Pending invitation. Record the response timestamp. Decline supports an
  optional reason and optional note. Reasons shown are Schedule conflict, Budget too low,
  Target audience mismatch, and Fully booked; the preview limits the note to 300 characters.
- Retrieve the existing offer for an invitation, including price, estimated delivery date,
  optional message, status, creation timestamp, and withdrawal timestamp where applicable.
- Submit an offer only for an Accepted invitation. Price is a non-negative decimal with at
  most two fractional digits and a maximum of 99,999,999.99 THB. Zero is valid. Delivery is a
  required calendar date no later than the job deadline. The message is optional, maximum
  300 characters. A successful new offer is Pending.
- Withdraw only a Pending offer. Withdrawal is final: a withdrawn offer still counts toward
  the one-offer-per-invitation constraint, and a replacement offer is forbidden.
- Return distinguishable errors for missing/unauthorized resources, inactive requests,
  duplicate offers, invalid fields, and offers no longer eligible for withdrawal.

The backend must enforce ownership, state transitions, uniqueness, monetary/date validation,
and timestamps transactionally. Accepting an invitation indicates interest; it does not hire
the marketer or move the job into progress. The extra Figma fields and withdrawal behavior were
explicitly requested in addition to the backlog's original price-only offer story.

## Integration boundary

`src/features/job-invitations/types.ts` contains frontend view models and the asynchronous
`InvitationActions` callbacks. UI components receive data and callbacks and do not access storage.
The demo adapter is isolated under that feature's `demo/` directory. The marketer demo host
composes the feature and handles its URL state.

When the backend contract is published, generate its types using `pnpm generate:api`, map its
responses into these view models, and implement server reads and same-origin BFF mutations using
the existing API/session clients. Refresh authoritative data after mutations; handle stale-state
conflicts without reporting success or losing drafts. Do not reuse the demo store for live data.
The current decimal strings, status names, and callback parameters are not a backend contract.

## Verification

Unit/component tests cover validation, transitions, persistence, reset, blocked/corrupt storage,
direct links, navigation, and action failures. The preview tests assert no `fetch` requests.
`pnpm exec playwright test --config=playwright.demo.config.ts` runs the workflow against a separate
development server on port 3101, on desktop and mobile. This config never changes the production
demo gate or the existing production E2E configuration.

If bundled Chromium is unavailable, set `PLAYWRIGHT_CHANNEL=msedge` to use an installed Edge
browser. On hosts with a restricted temporary directory, `PWTEST_CACHE_DIR` can point to
`.artifacts/playwright-cache` inside the repository.
