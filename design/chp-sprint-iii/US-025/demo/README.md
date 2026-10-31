# US-025 interactive handoff

> Current1.7.0 presentation and recovery guidance is in the [design book](../../book/README.md) and [pending-operation record](../../book/index.html#pending-operation). Dismissal never blocks browsing or claims rollback of a dispatched request. Same-tab navigation restores uncertainty or a confirmed local result without replaying a write; author Reset/scenario selection clears the fictional journal. Older URL/frame descriptions below describe their original iteration.

This directory is the runnable DOM implementation for the accepted-job start flow. It targets the CU Ways Rose × Slate 1.3.0 feedback revision; see [rendered coverage and limits](../../REVIEW.md). Keep the selected Round 10 appearance and inspected frontend available for comparison, with later user corrections taking precedence. The outer author page supplies scenario, content, viewport and mock-response controls; `screen.html` runs the product screen in a same-origin iframe. The product screen is ordinary HTML rendered from the canonical 41-state story model, with the shared CU Ways theme recipes and artwork.

## Run locally

From the CUWAY workspace root, start the shared story server:

```powershell
node "UX UI/serve.mjs" --port 4177
```

Open `http://127.0.0.1:4177/US-025/demo/index.html`. The source definitions, flow notes and [shared theme lab](../../theme/lab.html) are linked from the author page. The browser needs a local HTTP origin so the module imports and same-origin iframe message checks work.

Build and check the generated scenario module, then run focused behavior tests:

```powershell
node "UX UI/US-025/demo/build.mjs"
node "UX UI/US-025/demo/build.mjs" --check
node --test "UX UI/US-025/demo/behavior.test.mjs" "UX UI/US-025/demo/navigation.test.mjs"
```

## Author controls

The scenario selector contains L01–L09, D01–D10, C01–C08 and R01–R14. Selecting a state exposes its trigger, expected behavior, action and next states. Content fixtures cover standard data, long Unicode text and a long brief URL, missing optional values, Completed and Cancelled terminal states, and an author-only mock 429 with a retry delay.

Controls are reflected in the URL and passed to the product iframe with `postMessage`. Both sides validate `event.source` and exact same-origin `event.origin`; the screen also validates every supplied scenario, fixture, theme, outcome and presentation value. The read-only request log records simulated reads, the one explicit start POST, result handling and safe navigation. Author-only response metadata never enters product copy.

The chosen width and height describe the iframe's inner viewport, excluding its decorative border. The host measures the header, navigation and tray at the current font size, allowing around 6rem of readable content space after the measured heading/filter lead-in before feedback, as story guidance. When that composition cannot fit, those controls enter normal document flow. Resize and rendered-size changes recalculate the choice, so enlarged controls cannot cover each other around a fixed breakpoint. Compositions with sufficient space retain the mobile floating Start tray and persistent navigation; the mobile tray contains Start only, and desktop Start remains inside its action panel. The Accepted status panel keeps one “Ready to start” heading and the sentence “Your offer was accepted. Start when you begin the campaign.”; neither is duplicated in the tray. This is a story fallback, not a global positioning rule. Shared measurements and type are documented in [the component guide](../../theme/COMPONENTS.md); do not turn them into fixed page positions. The whole confirmation dialog scrolls at constrained heights; its footer never covers its title or body. Normal confirmations initially focus Cancel. If the content needs scrolling, initial focus stays on the visible title so the explanation is read before reaching the footer actions.

To play the main flow, choose L02, open Job #41, wait for the detail loading state to resolve, choose Start job, then confirm. Set response timing to Hold to inspect the pending dialog; Escape and outside clicks leave it open. The author controls can resolve the held response or leave to C06, where opening a job performs a fresh read. To test recovery, choose Unknown outcome / timeout and Accepted as the follow-up read. The screen reconciles with GET only; a new confirmation is needed before another POST. Sign-in and return is also a mock flow and always performs a fresh detail read without replaying Start.

## Local navigation and snapshots

Pager arrows, View job and My Jobs return links are native anchors with local `screen.html` destinations. The URL carries `filter`, `page` and the selected `job` where applicable. Changing a filter resets page to one; an out-of-range page is clamped to the available results. Ordinary same-tab clicks use the mock transition, while modifier-click, copied links and reload use the same destination. Browser Back restores list context and the originating item when available. The author page's URL and Open screen link follow the live screen; changing presentation controls does not reset the journey.

Normal View job reads the selected fictional record, so list, detail and confirmation show the same creator, surveys and agreed price. Explicit refresh/reconciliation and recovery use the author-selected follow-up outcome. Confirmed mock status changes and counters remain in memory through that journey and browser history. Choosing a new scenario/fixture resets the mock case and seeds any known snapshot status; these are not application data or durable persistence. Reloading opens a deterministic scene/record, not a server read.

Use the scenario chooser to inspect all 41 named snapshots, including loading, confirmation and pending states. Canonical URLs never restore a Start command: C01/C02 reload as D02, and C03–C05 reload as R13 with a GET-only read. An explicit `read=1` marks a detail read; `readMode=configured` preserves a recovery/follow-up read rather than an ordinary record read. Selecting D01 in the author controls keeps its loading snapshot inspectable. C08 remains a known-rejection snapshot with explicit refresh. Native browser Back during a pending Start retains the C06 uncertainty notice and requires a fresh read when the job is reopened. No navigation or reload sends a mock Start POST; that requires a new explicit confirmation. A pending list completion is cancelled when opening a detail, so rapid page-to-entry navigation cannot overwrite the new screen.

## State and fixture source

`../model/scenarios.json` is the canonical story and fixture file. `build.mjs` validates its 41 ordered IDs and fixture contract, then generates `scenarios.mjs` for browser imports. Run the build check after changing the model; do not hand-edit the generated module. Source definitions preserve the original `figma-build/scenarios.json` story content, while the separate fixture section makes the local data cases reproducible.

The demo uses fictional data and never calls an API, reads private user data, or persists a job mutation. Its start results, refreshes, rate limits and sign-in are deterministic local simulations. The shared recipes load Inter from `theme/assets/`, so current rendering has one font source and does not depend on historical SVG exports.

## Proof limits

The Node tests cover canonical state generation, cancellation, single-submit behavior, pending dismissal, unknown-outcome reconciliation, sign-in return, safe navigation, URL parsing/destinations, shared mock records and unavailable-data clearing. Actual browser navigation and focus checks are described in [the review record](../../REVIEW.md); Node tests alone do not establish browser behavior. Neither proves a backend contract, real authentication, durable persistence or native mobile safe-area rendering. A fresh, unbiased review of actual rendered Light/Dark and responsive/keyboard states is required for visual acceptance; the root adjudicates its findings against source and render evidence. Functional green checks alone are not visual approval.

## Shared feedback

Version 1.3 uses `feedbackBlock` for each message-associated recovery action, with no controls in the banner/live region. It shares the same icon/copy grid in titled and body-only messages. Canonical copy lives in `model/scenarios.json`, including stale results and the known-rejection read check; regenerate `scenarios.mjs` after edits. R01/R13 checking messages are polite info updates. Primary Start remains in its task context. The US-026 live proof prototype also consumes this feedback recipe selectively; its older shell and SVG snapshots are not part of this adoption.

Pending R01/R13 reads present polite checking feedback without another Refresh control; a failed check exposes recovery in R04. C08 shows a busy, disabled refresh control while its actual follow-up read runs. Visible feedback owns its announcement, so an obsolete hidden message does not repeat it after a state change.
