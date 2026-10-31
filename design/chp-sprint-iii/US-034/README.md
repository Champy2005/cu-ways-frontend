# US-034 · Verified marketer reviews

[Interactive handoff](demo/index.html) · [Product screen](demo/screen.html) · [Canonical scenarios](model/scenarios.json)

Runnable local HTML with shared theme 1.8.0 and 10 named states. Representative rendered states were independently reviewed in both themes; see the review record for scope and limitations.

## Requirements and provenance

Source inspected on 29 October 2026: `C:/Users/thana/Downloads/Backlog (3).xlsx`, Project Backlog row 35; Sprint Backlog III rows 98–100. Current backend OpenAPI was inspected; these proposed UI flows do not imply shipped mutation endpoints. Both application repositories remain unchanged.

1. Show only reviews on Completed jobs where this marketer held the accepted offer.
2. Display a 1–5 rating, optional comment, created_at and linked job_id.
3. When no qualifying reviews exist, show No reviews yet / No ratings yet and no numeric zero average.
4. Keep loading and read errors distinct; support long comments, rating filters and pagination.

Cards and aggregate ratings use the same qualifying Completed-job records with this accepted marketer and valid integer 1–5 rating. Empty average is null. Rating filters preserve the overall aggregate. Job links open a public verification context without contract/financial data.

## Run and play

Run `node "UX UI/serve.mjs" --port 4180` from CUWAY, then open `http://127.0.0.1:4180/US-034/demo/index.html`. The studio keeps author controls outside the product iframe. Choose a state and operate the actual screen. Configure responses, or select Hold for inspection then Resolve pending step. Unknown outcomes need a read before another explicit mutation. Reload chooses a deterministic snapshot and never replays a command.

| ID | State | Expected behavior |
| --- | --- | --- |
| A01 | Verified reviews | Show average, count and verified cards from completed jobs. |
| A02 | No reviews yet | Show No reviews yet and No ratings yet without a 0.00 average. |
| A03 | Rating-only reviews | Show rating, date and linked job without inventing a comment. |
| A04 | Long written review | Wrap the complete comment without horizontal overflow. |
| A05 | Next review page | Show bounded pagination and retain rating filter. |
| B01 | Nonqualifying records excluded | Exclude them from cards, count, average and distribution. |
| B02 | No matching rating | Show a filter-specific empty state while preserving the true overall rating. |
| R01 | Reviews loading | Do not invent a zero rating or empty review conclusion. |
| R02 | Reviews read failed | Show retry and suppress the unavailable rating. |
| R03 | Profile unavailable | Show a generic unavailable state without review details. |

## Parameters and specialization

Shared appearance comes from `theme/theme.json`, generated tokens, `components.mjs` and `recipes.css`; no global token is overridden. Named local specialization: **Verified marketer reviews task composition**. `stories/screen.css` owns intrinsic task/reference columns, normal-flow mobile navigation, wrapped records and scrollable native dialogs. This story owns its content, scenarios and domain rules.

Studio parameters: Light/Dark; Glass/Opaque bars; 320/390/768/1280px width; 240–1200px height; 100/150/200% text; standard/long Unicode content; reduced motion/transparency; next operation and read outcome; automatic/held response timing. Presentation changes retain the journey. Scenario selection/reset replaces local state. URL parameters are initial presentation/snapshot settings, never submitted commands.

Native dialogs contain focus and initially focus safe dismissal. Pending dialogs permit Close, Escape, outside dismissal and Continue browsing without undoing a dispatched operation. Closing restores focus. Errors have field associations; shared feedback announces results. Layout grows with content and dialogs scroll at short heights. OS and explicit motion/transparency fallbacks are supported.

## Checks and portable handoff

Run `node "UX UI/stories/build.mjs" --check` and `node --test "UX UI/stories/chp.behavior.test.mjs"`. Browser evidence and independent review status: [completion record](../stories/REVIEW.md). Package with `node "UX UI/package-handoff.mjs"`.

Fixtures are fictional and transitions are in memory. They do not prove application API permissions, concurrency, payment processing or durable persistence. Frontend adoption is separate. Figma/SVG stay read-only.
