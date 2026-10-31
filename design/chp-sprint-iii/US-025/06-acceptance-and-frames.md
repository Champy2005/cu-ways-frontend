# Acceptance criteria and HTML scenario coverage

> **Current presentation authority · 1.6.0:** Read the [design book](../book/README.md), [human principles](../book/PRINCIPLES.md) and canonical [scenario model](model/scenarios.json). Older copy, layout and pending-dismissal descriptions below are retained research/provenance, not current presentation requirements. Current UI uses concise Contract/survey hierarchy and declarative bounded dialogs. Pending operations can dismiss/reopen with12-second unknown/read recovery; closing UI does not claim rollback. Offline Start opens feedback without a write. Domain eligibility, access and server-authority requirements still apply.

No start-specific tests were executed: no US-025 implementation exists. The following is the required future acceptance plan, not a report of passing tests.

## Acceptance-to-proof matrix

| ID  | Criterion                                                                                                                                              | Cheapest meaningful proof                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| A01 | My Jobs shows only selected-offer-owned jobs; accepted invitations on Pending jobs excluded                                                            | Backend service/repository tests + authenticated list read; UI fixture has competing marketer and creator-only variants.           |
| A02 | Filter/page/empty/loading/error states are distinct and stable under out-of-order reads                                                                | Component tests with delayed/reversed GET responses; browser list navigation.                                                      |
| A03 | Hired Accepted job alone enables Start; required data invalid fails closed; optional missing context allowed                                           | Component eligibility matrix + backend domain tests across all5 lifecycle states.                                                  |
| A04 | Opening/Cancel/Escape/outside close sends no mutation; focus trapped/restored                                                                          | Component action spy and keyboard browser test. Browser Back before submit performs no mutation.                                   |
| A05 | Confirm sends one in-flight request; duplicate click/Enter does not duplicate POST                                                                     | Delayed mocked action + keyboard/touch checks.                                                                                     |
| A06 | Successful start changes only job Accepted→In Progress; offer/request integrity retained                                                               | Disposable PostgreSQL integration; fresh connection read after commit; compare accepted_offer_id, prices and all related statuses. |
| A07 | Non-owner/creator-only/admin-only/anonymous cannot start; denial does not leak cached data                                                             | Handler/service tests and scoped authenticated HTTP tests;401/403/404 behaviors covered.                                           |
| A08 | Creator US-023 hiring still stops at Accepted                                                                                                          | Existing hire regression + new integration assertion.                                                                              |
| A09 | Two tabs/racing start calls yield one effective transition, one started outcome and remaining already_in_progress outcomes with consistent final state | Concurrent PostgreSQL test on owned `_test` fixtures; both responses and independent final read inspected.                         |
| A10 | Timeout after commit, timeout without commit, failed reconciliation,5xx and malformed success are safe                                                 | Mocked UI/action cases + real API integration where possible. Never assert a rollback from transport failure.                      |
| A11 | Accepted after reconciliation permits only a fresh explicit retry under agreed idempotent contract                                                     | Component interaction test + backend repeat-start test.                                                                            |
| A12 | Authorized repeated/concurrent start returns 200/already_in_progress;409 reconciles terminal/not-ready states;401 redirects and returns without replay | Action mapping tests + browser navigation fixture.                                                                                 |
| A13 | Long text/URL, zero price, null brief/deadline/target, absent delivery date render correctly                                                           | Fixture variants + desktop/phone visual inspection.                                                                                |
| A14 | Correct nav active on detail; breakpoint/UA distinction; CTA never overlaps bottom nav                                                                 | Browser matrix from 03, screenshots at 390/1440 and breakpoint sentinels. Measure horizontal overflow and hit targets.             |
| A15 | Modal reachable at 200% text/400% zoom/landscape; reduced motion and both themes work                                                                  | Browser keyboard/viewport checks and contrast calculation on composited colors.                                                    |
| A16 | Server state persists through reload/login/navigation; no demo fixture substitution                                                                    | Real browser-to-API flow with explicit disposable authenticated fixtures, then new API read/DB connection.                         |
| A17 | Shared header/menu/navigation use the reference 72px header, 44px controls, 124px/152px logo, 51px birds, attached divided 48px menu, and agreed mobile/desktop labels and selection states | Inspect rendered lab and story in both themes, enlarged text and narrow/wide layouts; measure component bounds and read accessible names. Mobile selection has no tile/frame/marker; desktop retains its moving tile; keyboard focus stays separate. |
| A18 | Each route/state has one return action; Accepted status panel has one Ready to start heading and the accepted explanatory sentence once, without a decorative green rail; mobile status and price precede context; the mobile tray contains only Start and desktop Start stays in the action panel | Inspect the composed list/detail states on phone and desktop, including panel copy and tray contents. |
| A19 | Compact arrow pagination remains understandable to assistive technology and exposes the current page                                                    | Keyboard/browser check for previous/next accessible names, anchor destinations and `aria-current` on the active page.              |
| A20 | Visual acceptance is based on actual rendered output and an independent, fresh review against user decisions and reference inputs                        | Fresh reviewer examines Light/Dark screenshots plus responsive/keyboard states; root resolves findings against direct evidence.   |

## Future test execution boundaries

Run focused component/handler/repository tests as they are created, then repository quick checks and generated API agreement. Existing Playwright projects chromium/mobile-chromium are useful, but current public/session-guard tests do not prove hired-job behavior. A route-mocked browser test proves UI branch behavior only. Production build or doctor success does not prove the transition.

Database verification requires explicit TEST_DATABASE_URL pointing to a disposable loopback DB ending `_test`; do not use the normal app database, run a seeder or migrate it implicitly. No accepted-job browser fixture was provisioned for this planning task. Any future skip/missing persistence proof is INCONCLUSIVE.

## Current HTML acceptance surface

`model/scenarios.json` owns the 41 canonical IDs. `demo/` generates its browser module and renders these states with shared global components. One responsive DOM implementation covers theme/viewport combinations; do not duplicate 325 static screen copies to claim coverage. The scenario chooser and labelled flow links provide direct access, while ordinary controls exercise the main and recovery journeys.

Verify the latest user corrections in both themes: a clean continuous refresh/spinner icon; neutral message-only banners with semantic icon/rail and sibling actions; no upper header rim; one plain top Back link per normal detail route; compact arrow pagination with full accessible names; the shared 1.2.0 header/menu/navigation dimensions and labels; Inter with the compact product density; mobile status/price before context; one Ready to start heading and the accepted explanatory sentence in the status panel; mobile tray containing only Start and desktop Start inside its action panel; no duplicated panel copy in the tray or decorative green rail; live parameters/draft export/import; unchanged source after preview tuning. See the generated verification evidence and demo README for executed checks and explicit runtime limits. Functional green checks do not mean visual approval. A fresh, unbiased reviewer must inspect actual rendered work; root evaluates and records each finding, rejecting an inaccurate finding only with direct evidence. Product permission/concurrency/persistence criteria still require implementation evidence.

## Round 10 visual-comparison inventory (Figma remains read-only)

Keep the selected Round 10 appearance available for visual comparison; do not dismiss it as historical. Read the [latest Round 10 direction notes](color-playground/ROUND-10.md); where intermediate captures disagree, use the latest selected mobile/desktop [selection](color-playground/round10-selection-mobile.jpg) and [desktop](color-playground/round10-selection-desktop.jpg) artifacts. Do not create or update Figma/SVG artifacts unless the user explicitly authorizes that work. Later user corrections take precedence over visual details in the reference. Layout rows: Foundations/components → Mobile light → Mobile dark → Desktop light → Desktop dark → Responsive/edge cases → annotations and prototype key. Original product frames are preserved. The complete polished v2 set is on the US-025 Complete SVG handoff page, root 806:177; v1 remains available as reference context.

Frame naming: `US025 / {Mobile|Desktop} / {Light|Dark} / {ID} — {State}`. The 390×844 mobile and 1440×900 desktop frames are comparison examples, not global responsive boundaries or fixed export requirements. Use viewport-sized frames to inspect content scroll rather than static tall exports that hide overflow. Separate scroll-position scenario frames are included; native prototype wiring is not included.

### Canonical composed frames (each in mobile/desktop and light/dark:36 frames)

| Frame ID | Contents                                        | Branch coverage          |
| -------- | ----------------------------------------------- | ------------------------ |
| F01      | My Jobs with active cards/filter/pagination     | L02/L08, A01/A02         |
| F02      | Accepted detail with all context                | D02, A03                 |
| F03      | Start confirmation over F02                     | C01/C02, A04             |
| F04      | Submitting/slow confirmation                    | C03–C06, A05             |
| F05      | In Progress detail + successful feedback        | C07/D04/R02/R05, A06/A08 |
| F06      | Accepted detail + rejected-start alert          | R07/R10, A07             |
| F07      | Unknown outcome + Refresh only                  | R01/R04/R12, A10/A11     |
| F08      | Generic unavailable job without private details | D06/D07/R08/R09, A07/A12 |
| F09      | My Jobs empty and initial load error comparison | L03–L06/L09, A02         |

36 canonical frames does not mean collapsing unique copy. F09 must contain clearly named independent empty/error states or adjacent subframes. If F08's access/session variants need different actions, show each variant beside its canonical composition. Do not use one contradictory screenshot for all states.

### Additional specified variants

Component/state boards show: list/detail skeletons; refresh failed with stale content; filter-empty versus globally empty; Completed/Cancelled; invalid required context; missing optional context; already-started; Accepted after safe reconciliation; session expiry; feature unavailable; rate limiting. Each references its state ID and exact copy. Compose additional full frames whenever layout/action placement changes rather than assuming the developer will infer it.

Responsive sentinel frames (include both sides of each breakpoint):320×568 ready and modal;768×1024 and 1024×768 tablet-class navigation, plus 1024×768 desktop-class comparison;1023×900 desktop hamburger and1024×900 desktop compact nav;1199×900 stacked detail and1200×900 two-column detail;1920×1080 max feature width;844×390 phone modal. Add200% text long-content cases, RTL is not introduced, Thai/English long names and Unicode text must wrap.

### Prototype links and annotations

F01 View job→F02; Start→F03; Cancel/Escape/outside→F02; confirm→F04; scenario outcomes→F05/F06/F07/F08. F07 Refresh branches to Accepted safe-retry/In Progress/terminal/still unknown. F05 Back→updated F01 (filter may remove card if Accepted-only selected). Annotate normal browser Back, no POST from navigation, pending dismissal restrictions, focus destinations, z-index/inert layers, sticky offsets, optional data and token names.

Handoff complete only when all requirement and branch IDs map to a frame, component variant or explicit annotation, with no unknown field/permission behavior delegated to frontend guesswork.

## Complete branch-to-artifact map

| Branch IDs      | Required composition / named variant / annotation                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| L01             | F01/ListSkeleton variant; aria-busy annotation.                                                                                                              |
| L02,L08         | F01/Loaded + FilterPageLoading variant; URL/filter/focus and out-of-order response annotation.                                                               |
| L03,L04,L05     | F09/NoActiveJobs, NoHiredJobs, NoFilterResults — separate text/action variants.                                                                              |
| L06             | F09/InitialListError with Try again; never reuse empty wording.                                                                                              |
| L07             | F01/StaleResults banner and retained old cards.                                                                                                              |
| L09             | F09/FeatureUnavailable with Back to overview.                                                                                                                |
| D01             | F02/DetailSkeleton; no Start.                                                                                                                                |
| D02,D09         | F02/Ready and MissingOptionalContext variants.                                                                                                               |
| D03             | F08/DetailLoadError: exact detail.error copy, Try again + one top-level Back to My Jobs, no job context/Start.                                               |
| D04,D05         | F05/InProgress and TerminalCompleted/TerminalCancelled variants.                                                                                             |
| D06,D07,D08,D10 | F08/Unavailable, MembershipRequired, InvalidRequiredContext, SessionExpired; distinct heading/actions and private-data clearing annotations.                 |
| C01,C02         | F03; Cancel/Escape/outside/normal browser Back annotations and focus targets.                                                                                |
| C03,C04,C05,C06 | F04/Submitting + Slow; duplicate activation, dismissal lock,20s deadline and normal navigation annotations.                                                  |
| C07             | F05/Started; announced once, heading focus, cache invalidation.                                                                                              |
| C08             | F06/RejectedThenRefresh; CTA remains disabled until authoritative retry eligibility.                                                                         |
| R01,R04,R12     | F07/Checking, OutcomeUnknown, RejectionRefreshFailed; latest/last-confirmed distinction, Refresh only.                                                       |
| R02,R05         | F05/AlreadyInProgress; no claim of which session started it.                                                                                                 |
| R03             | F02/AcceptedAfterReconciliation; exact warning + new confirmation; idempotency dependency annotated.                                                         |
| R06             | F05/TerminalStateChanged; no Start strip.                                                                                                                    |
| R07,R08,R09,R10 | F06/Forbidden or NotReady and F08/Unavailable or SessionExpired; read permission decides whether details remain.                                             |
| R11             | F02/Offline: offline.body banner, disabled start, reconnect→Refresh job→fresh ready state. No queued POST.                                                   |
| R13             | F02/FocusReturnChecking: inline checking label + disabled Start, preserve focus; prototype branches to Ready/InProgress/terminal/unavailable/refresh failed. |
| R14             | F05/PostSuccessRefreshFailed: keep last-confirmed In Progress, stale.body warning + Refresh job; never revert to Accepted.                                   |

F02/Offline and F05/PostSuccessRefreshFailed require composed390/1440 examples in both themes because action presence/placement changes. FocusReturnChecking may be a named component variant plus explicit prototype annotation, with the same panel geometry.
