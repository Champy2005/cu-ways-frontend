# CU Ways · compiled UX/UI reference

Five interactive product screens, 94 named states, Light/Dark, revision 1.9.1. This is a runtime export: no book, action/request logs, author studio, theme editor, tests, source generators, build dependencies or screenshots.

## Run and inspect

From this folder run `node serve.mjs --port 4188` using Node.js 22.13+, then open <http://127.0.0.1:4188/>. Ctrl+C stops the local server. Use the story/state/theme/width selectors or open the product screen alone. The outer viewer is inspection chrome; reproduce the product inside the iframe.

The viewer holds simulated responses so pending states can be inspected; they still time out into recoverable uncertainty. Add `live=1` to the viewer URL for automatic responses during interactive journeys. Changing the selected state reloads a fictional snapshot, never a product mutation. Direct US025 URLs preserve safe navigation rules; `snapshot=1` explicitly selects author-defined confirmation/pending snapshots.

| Story | States | Behavior to reproduce |
| --- | --- | --- |
| US025 | L01–L09, D01–D10, C01–C08, R01–R14 | My Jobs list/filter/pagination; accepted job detail; explicit Start confirmation; pending, rejected, stale, offline and unknown outcomes. |
| US026 | A01–A06, B01–B04, C01–C04 | HTTP(S) proof-link form; saved URL/server timestamp; field/type errors; read recovery, status/access changes. |
| US027 | A01–A06, B01–B04, R01–R04 | Completion requires In Progress, matching selected Accepted offer, Paid payment and at least one Proof. Missing Proof blocks completion. Actor/endpoint require agreement. |
| US028 | A01–A06, B01–B04, R01–R05 | Confirm cancellation consequences; reject Paid/Completed contracts; reconcile unknown outcomes before retry. |
| US034 | A01–A05, B01–B02, R01–R03 | Qualifying completed-job reviews only; actual rating/count, filters, bounded pagination, comment disclosure; no invented zero average when empty. |

## Replication inputs

- `states.json` gives each state’s trigger, expected result, action and next states, plus available story criteria. Use it as the behavioral inventory, and render the matching screen to inspect the actual composition.
- `assets/core.css` contains the complete Light/Dark `--cu-*` values and shared `.cu-*` component recipes: action roles, typography, spacing, radii, surfaces, borders, focus, feedback, navigation and motion/transparency fallbacks. Read CSS variables or browser computed styles; reproduce intrinsic layouts rather than fixed screenshot coordinates.
- `assets/025.css`, `026.css` and `stories.css` contain the scoped page layouts. `runtime.js` is the compiled interactive reference with embedded fictional fixtures and vector artwork. `viewer.js` only drives inspection. Local WOFF2 fonts preserve Inter weights 400/600/700.
- Keep reusable components separate from story-specific copy/state/layout in the adopting app. This runtime is a visual/interaction reference; translate it into the app’s existing components and API conventions rather than importing the mock runtime as production business logic.

Additional viewer query parameters: `fixture=long`, `textScale=150|200`, `material=opaque|glass`, `reducedMotion=1`, `reducedTransparency=1`, and `live=1`. Combine them with `story=025`, `scenario=C01`, `theme=dark`, and `width=390|1440|fit`. Screen response parameters are story-specific: US025 `startOutcome`/`refreshOutcome`; US026 `saveOutcome`/`loadOutcome`/`checkOutcome`/`reconciliationResult`; US027/028 `outcome`/`read`. These select simulated responses only.

## Required behavior and boundaries

Use native links for navigation and buttons for operations. Keep keyboard focus visible; dialogs contain focus, dismiss with Escape and restore focus. Reduced motion retains feedback; reduced transparency uses opaque surfaces/scrims. Initial loading preserves structure and differs from an empty result. Do not truncate critical validation or irreversible consequences; long names need a full detail destination and long comments may disclose in place.

Loading remains escapable. Dismissal after dispatch preserves the pending operation and a visible revisit/recovery route, prevents duplicate writes, and does not claim rollback. Unknown outcomes require an authoritative read before another mutation. The runtime retains only the temporary operation state needed to demonstrate this behavior; it has no action/request log.

Proof uses type Proof, trimmed HTTP(S) URL and server timestamp; success clears the draft only after confirmation. Keep drafts on failure/uncertainty, distinguish syntax from link access/safety, and remove private data on lost access. Proof alone never completes a job. Real identity/idempotency and permissions belong to the backend.

Current explicit user decisions take priority. Selected Round 10 and inspected frontend remain comparison inputs in the separate original workspace; later corrections override them. Pink commits, blue task actions, slate-blue support, transparent quiet dismissal and tonal circular pager hover are distinct roles. Purple was rejected. Human replacement-palette and complete-page acceptance remain pending; unvisited states remain unvisited. A compiled export or passing check grants no new visual approval.

Fixtures make no product API calls and do not prove authorization, concurrency or persistence. Routes/error codes in the simulation are not agreed contracts. Inspect both current application repositories/OpenAPI before implementation. This folder is separate from the Next.js app; the original workspace `UX UI` sources/references remain unchanged. Material design changes still need component/parent/page review in both themes, relevant responsive/keyboard/fallback states and independent rendered inspection.
