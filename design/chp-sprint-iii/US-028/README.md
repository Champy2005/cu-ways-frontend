# US-028 · Cancel a job

[Interactive handoff](demo/index.html) · [Product screen](demo/screen.html) · [Canonical scenarios](model/scenarios.json)

Runnable local HTML with shared theme 1.8.0 and 15 named states. Representative rendered states were independently reviewed in both themes; see the review record for scope and limitations.

## Requirements and provenance

Source inspected on 29 October 2026: `C:/Users/thana/Downloads/Backlog (3).xlsx`, Project Backlog row 29; Sprint Backlog III rows 47–48. Current backend OpenAPI was inspected; these proposed UI flows do not imply shipped mutation endpoints. Both application repositories remain unchanged.

1. Allow the owning creator to cancel Pending, Accepted or In Progress jobs only when no payment is Paid.
2. Confirmed cancellation sets Cancelled, closes active job requests and rejects remaining Pending offers.
3. Reject cancellation for Completed or Paid jobs, keep terminal states read-only and recover unknown outcomes with a read.

Cancellation closes active requests and rejects remaining Pending offers. Accepted-offer provenance is retained. Paid/Completed races reject cancellation. No backend transaction or cancellation endpoint is established.

## Run and play

Run `node "UX UI/serve.mjs" --port 4180` from CUWAY, then open `http://127.0.0.1:4180/US-028/demo/index.html`. The studio keeps author controls outside the product iframe. Choose a state and operate the actual screen. Configure responses, or select Hold for inspection then Resolve pending step. Unknown outcomes need a read before another explicit mutation. Reload chooses a deterministic snapshot and never replays a command.

| ID | State | Expected behavior |
| --- | --- | --- |
| A01 | Pending job | Cancellation is available to the creator. |
| A02 | Accepted job | Show current contract details and an explicit cancel action. |
| A03 | In Progress job | Allow cancellation with its consequences explained. |
| A04 | Cancellation confirmation | Show job identity and effects; Keep job closes the dialog without changes. |
| A05 | Cancellation pending | Keep the dialog open and block duplicate requests and dismissal. |
| A06 | Cancellation confirmed | Show Cancelled, zero active requests and zero Pending offers; remove cancellation. |
| B01 | Paid job | Explain why cancellation is unavailable and do not enable cancellation. |
| B02 | Completed job | Preserve payment and review history; do not allow cancellation. |
| B03 | Already Cancelled | Keep cancellation read-only and do not resubmit. |
| B04 | Unverified state | Do not guess eligibility; offer a fresh read. |
| R01 | Unknown cancellation outcome | Check current job state before a new cancellation. |
| R02 | Cancellation rejected | Keep the current contract and offer refresh. |
| R03 | Access removed | Remove private contract data and mutation controls. |
| R04 | Job read failed | Show failure rather than an empty or cancellable job. |
| R05 | Job loading | Prevent cancellation while eligibility is unknown. |

## Parameters and specialization

Shared appearance comes from `theme/theme.json`, generated tokens, `components.mjs` and `recipes.css`; no global token is overridden. Named local specialization: **Cancel a job task composition**. `stories/screen.css` owns intrinsic task/reference columns, normal-flow mobile navigation, wrapped records and scrollable native dialogs. This story owns its content, scenarios and domain rules.

Studio parameters: Light/Dark; Glass/Opaque bars; 320/390/768/1280px width; 240–1200px height; 100/150/200% text; standard/long Unicode content; reduced motion/transparency; next operation and read outcome; automatic/held response timing. Presentation changes retain the journey. Scenario selection/reset replaces local state. URL parameters are initial presentation/snapshot settings, never submitted commands.

Native dialogs contain focus and initially focus safe dismissal. Pending dialogs permit Close, Escape, outside dismissal and Continue browsing without undoing a dispatched operation. Closing restores focus. Errors have field associations; shared feedback announces results. Layout grows with content and dialogs scroll at short heights. OS and explicit motion/transparency fallbacks are supported.

## Checks and portable handoff

Run `node "UX UI/stories/build.mjs" --check` and `node --test "UX UI/stories/chp.behavior.test.mjs"`. Browser evidence and independent review status: [completion record](../stories/REVIEW.md). Package with `node "UX UI/package-handoff.mjs"`.

Fixtures are fictional and transitions are in memory. They do not prove application API permissions, concurrency, payment processing or durable persistence. Frontend adoption is separate. Figma/SVG stay read-only.
