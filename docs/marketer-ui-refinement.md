# Marketer UI refinement and rendering notes

The marketer experience uses the project's shadcn `base-nova` components. Shared primitive defaults are preserved; marketer card, popover, input, foreground, focus, and brand colors are mapped in `src/features/marketers/marketer.css`.

## Profile and demo behavior

- `/marketer/profile?tab=professional` is the default professional editor. `?tab=basic` opens contact information. Native History API updates avoid a server navigation and support Back/Forward.
- Both tab panels stay mounted. Each form owns its draft, validation, pending state, error, and success feedback. Saving either form does not reset the other.
- Basic information reuses `useContactForm` with `/profile`. Its `ContactProfile` and save input are derived from generated User types. Name and email remain read-only; optional Phone and LINE ID continue using `PUT /api/profile`.
- The server checks the session before fetching both sections concurrently. An explicit permission or eligibility failure remains a blocking response. Transport failures affect only the unavailable section.
- Demo views load separately and change through local history. Contact saves, professional saves, and service changes remain in session storage. Sessions created before contact support receive contact defaults without losing saved professional information or services. Reset restores all fixtures.
- The explicit server-only `MARKETER_DEMO_ENABLED=true` flag enables the demo in development. Production still rejects the demo regardless of that flag. No demo action calls a backend API.

## Rendering boundaries

- `MarketerShell` renders static composition on the server and passes page children through `MarketerTheme`. Theme controls, active navigation, mobile menu behavior, and forms are client boundaries.
- The mobile dropdown implementation loads only at mobile widths. Desktop does not eagerly download it. Its non-modal menu supports keyboard navigation and dismisses on Escape, selection, outside interaction, and desktop resizing.
- `PublicServiceCatalog` is a separate display component exported for integration. The live viewer route does not import the owner catalog, editor, mutation adapter, or confirmation dialogs.
- The owner catalog loads `CatalogDialog` on demand and preloads it on pointer/focus intent over management buttons. Existing final-focus callbacks, dirty-form confirmation, and duplicate-submission guards remain in place.
- Owner profile/statistics and profile/services requests start concurrently. Existing private API requests remain `no-store`; no user-shared data cache was introduced.
- Persistent header and bottom-navigation surfaces no longer use backdrop blur. Dialog-only blur remains. Reduced-motion preferences disable the marketer animations and transitions.

## Production bundle comparison

Measured on the same local checkout and installed dependencies, using the existing production artifacts before changes and `pnpm build` afterward. For each route, unique JavaScript paths referenced by `clientModules[*].chunks` in its `page_client-reference-manifest.js` were summed. Gzip values are the sum of Node `gzipSync` results for those files.

| Route               | Before, raw bytes | After, raw bytes | Raw reduction | Before, gzip bytes | After, gzip bytes |
| ------------------- | ----------------: | ---------------: | ------------: | -----------------: | ----------------: |
| Demo entry          |           217,927 |           98,192 |         54.9% |             72,529 |            33,393 |
| Live viewer catalog |           205,256 |           94,463 |         54.0% |             69,271 |            32,635 |

These are **route-referenced client chunk sizes**, not total page transfer or a Lighthouse score. They exclude runtime assets outside that manifest and deferred modules. Mobile subsequently loads its dropdown; opening a demo view or service editor downloads its module on first use. Adding shadcn's dropdown eagerly initially increased the bundle, which led to the mobile-only loading boundary.

The final viewer-referenced chunks contain none of the service editor, discard confirmation, or deletion confirmation text. Source imports also keep the viewer independent from owner controllers and browser mutation adapters.

Demo navigation tests exercise actual local links with `fetch` rejected and verify catalog/profile persistence. Native-history navigation replaces the previous server-linked fixture navigation. This is structural and test evidence, not a browser-network timing measurement. A comparable pre-change browser interaction-latency/CLS baseline was not captured: the previously running demo server was unavailable, and the available browser inspection interface does not expose the Performance API. No numerical latency or CLS improvement is claimed. Live request latency and real cross-account authorization remain backend integration checks.

## Verification

Focused coverage includes tab deep links/history, retained drafts, independent saves, optional clearing, contact failures and duplicate submissions, concurrent server loading, missing sessions, eligibility failures, old demo sessions, and Reset. Existing service publication/edit/deletion, validation, privacy, and request-boundary tests are retained.

Browser review uses 320, 375, 768, 1440, and 3840px layouts, with light and dark surfaces, profile typography, mobile dropdowns, and themed service dialogs. Computed profile labels are 16px/600 and input values are 16px/400. The fluid frame remains shared by header, navigation, and page content.

Run the full quality gate with `pnpm check`. If capturing its output on Windows, write the log outside `.next`: the build cleans that directory, and an open log there causes an `EBUSY` failure.

Final quality gate: `pnpm check` passed formatting, lint, type generation/typecheck, 126 tests across 21 files with coverage, dependency audit (no known vulnerabilities), and the production build. Overall line coverage was 74.79%. Backend files were not changed.
