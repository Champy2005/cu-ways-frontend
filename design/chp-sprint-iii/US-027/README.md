# US-027 · Completion blocked

[Interactive handoff](demo/index.html) · [Product screen](demo/screen.html) · [Canonical scenarios](model/scenarios.json)

Runnable local HTML with shared theme 1.8.0 and 14 named states. Representative rendered states were independently reviewed in both themes; see the review record for scope and limitations.

## Requirements and provenance

Source inspected on 29 October 2026: `C:/Users/thana/Downloads/Backlog (3).xlsx`, Project Backlog row 28; US-031 row 32; Sprint Backlog III row 39. Current backend OpenAPI was inspected; these proposed UI flows do not imply shipped mutation endpoints. Both application repositories remain unchanged.

1. Block completion without at least one Proof attachment; Brief and Other do not qualify.
2. Complete only an In Progress job with a valid selected Accepted offer, Paid payment and Proof.
3. Keep status unchanged on rejection and reconcile unknown outcomes before retrying.

US027 owns the missing-Proof warning. US031 also requires In Progress, the existing selected Accepted offer for this job, Paid payment and Proof. Completion operator is an illustrative system/admin role; actual actor permissions and the endpoint remain unagreed. This demo does not grant creator/marketer completion authority.

## Run and play

Run `node "UX UI/serve.mjs" --port 4180` from CUWAY, then open `http://127.0.0.1:4180/US-027/demo/index.html`. The studio keeps author controls outside the product iframe. Choose a state and operate the actual screen. Configure responses, or select Hold for inspection then Resolve pending step. Unknown outcomes need a read before another explicit mutation. Reload chooses a deterministic snapshot and never replays a command.

| ID | State | Expected behavior |
| --- | --- | --- |
| A01 | Missing proof | Show missing Proof and keep the job In Progress. Run completion check opens the blocked warning. |
| A02 | Completion blocked warning | Explain why sign-off is blocked, keep status unchanged, and offer a route to proof submission. |
| A03 | All requirements met | Enable an explicit completion check; proof alone is not sufficient. |
| A04 | Confirm completion | Confirm job identity and the final transition before sending a request. |
| A05 | Completion pending | Send once; allow Close, Escape and Continue browsing, preserve progress and reconcile after the bounded deadline. |
| A06 | Completion confirmed | Show Completed and remove the completion mutation. |
| B01 | Payment is not Paid | Show the missing payment prerequisite and block completion. |
| B02 | Accepted offer mismatch | Explain the offer prerequisite and keep status unchanged. |
| B03 | Job has not started | Do not expose a completion request for an unstarted job. |
| B04 | Cancelled job | Keep the terminal state read-only. |
| R01 | Unknown completion outcome | Offer a read-only status check; never automatically repeat completion. |
| R02 | Requirements unavailable | Show read failure rather than known prerequisites and disable completion. |
| R03 | Access removed | Remove all private job and delivery data. |
| R04 | Requirements loading | Announce the read and prevent completion until resolved. |

## Parameters and specialization

Shared appearance comes from `theme/theme.json`, generated tokens, `components.mjs` and `recipes.css`; no global token is overridden. Named local specialization: **Completion blocked task composition**. `stories/screen.css` owns intrinsic task/reference columns, normal-flow mobile navigation, wrapped records and scrollable native dialogs. This story owns its content, scenarios and domain rules.

Studio parameters: Light/Dark; Glass/Opaque bars; 320/390/768/1280px width; 240–1200px height; 100/150/200% text; standard/long Unicode content; reduced motion/transparency; next operation and read outcome; automatic/held response timing. Presentation changes retain the journey. Scenario selection/reset replaces local state. URL parameters are initial presentation/snapshot settings, never submitted commands.

Native dialogs contain focus and initially focus safe dismissal. Pending dialogs permit Close, Escape, outside dismissal and Continue browsing without undoing a dispatched operation. Closing restores focus. Errors have field associations; shared feedback announces results. Layout grows with content and dialogs scroll at short heights. OS and explicit motion/transparency fallbacks are supported.

## Checks and portable handoff

Run `node "UX UI/stories/build.mjs" --check` and `node --test "UX UI/stories/chp.behavior.test.mjs"`. Browser evidence and independent review status: [completion record](../stories/REVIEW.md). Package with `node "UX UI/package-handoff.mjs"`.

Fixtures are fictional and transitions are in memory. They do not prove application API permissions, concurrency, payment processing or durable persistence. Frontend adoption is separate. Figma/SVG stay read-only.
