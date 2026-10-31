# Component and page index

Machine-first lookup. Search visible wording, selector or symptom below; edit the linked canonical record, then change and review every listed consumer. `node "UX UI/book/build-index.mjs" --check` fails when this lookup is stale. `node "UX UI/stories/consistency-check.cjs"` inspects actual rendered components across all named states; a registry alone is not visual approval.

## navigation — Navigation hover and selection

Aliases: nav, header, desktop hover, rounded rectangle, moving tile, bottom bar

Selectors: .cu-header, .cu-nav-item

Consumers: US-025, US-026, US-027, US-028, US-034

Source: theme/components.mjs, theme/recipes.css

Record: [book/records/navigation.json](records/navigation.json)

Current review: Independent normal composition across all94 named states in both themes/mobile/desktop, plus selected native child/parent/page and stress/live scopes. Individual captured-only pixels remain unvisited; see1.9 coverage.

## back-navigation — Back navigation

Aliases: back, go back, return, Story library, top left, 4k

Selectors: .cu-back-link

Consumers: US-025, US-026, US-027, US-028, US-034

Source: theme/components.mjs, theme/recipes.css

Record: [book/records/back-navigation.json](records/back-navigation.json)

Current review: Independent normal composition across all94 named states in both themes/mobile/desktop, plus selected native child/parent/page and stress/live scopes. Individual captured-only pixels remain unvisited; see1.9 coverage.

## responsive-scale — Responsive size and type

Aliases: 4k, 2560, scaling, font size, desktop, breakpoints

Selectors: See owning page source

Consumers: US-025, US-026, US-027, US-028, US-034

Source: theme/theme.json, theme/recipes.css

Record: [book/records/responsive-scale.json](records/responsive-scale.json)

Current review: Independent normal composition across all94 named states in both themes/mobile/desktop, plus selected native child/parent/page and stress/live scopes. Individual captured-only pixels remain unvisited; see1.9 coverage.

## dropdown — Dropdown control and menu

Aliases: select, filter, status filter, arrow, rounded menu, options

Selectors: select, ::picker(select)

Consumers: US-025, US-026, US-027, US-028, US-034

Source: theme/components.mjs, theme/recipes.css

Record: [book/records/dropdown.json](records/dropdown.json)

Current review: Independent normal composition across all94 named states in both themes/mobile/desktop, plus selected native child/parent/page and stress/live scopes. Individual captured-only pixels remain unvisited; see1.9 coverage.

## feedback — Feedback and recovery

Aliases: banner, status, error, warning, info, success, rail, rim, recovery, color, offline

Selectors: .cu-banner, .cu-feedback

Consumers: US-025, US-026, US-027, US-028, US-034

Source: theme/theme.json, theme/components.mjs, theme/recipes.css

Record: [book/records/feedback.json](records/feedback.json)

Current review: Independent normal composition across all94 named states in both themes/mobile/desktop, plus selected native child/parent/page and stress/live scopes. Individual captured-only pixels remain unvisited; see1.9 coverage.

## actions — Actions and links

Aliases: button, tertiary, secondary, glow, shadow, contrast, Open brief, clickable, tonal, outline, Keep job, Got it, Stop waiting, More options

Selectors: .cu-action, .cu-close

Consumers: US-025, US-026, US-027, US-028, US-034

Source: theme/theme.json, theme/recipes.css, theme/components.mjs

Record: [book/records/actions.json](records/actions.json)

Current review: 1.9.1 focused compact pager review: both hosts/themes at390/1440/2560, Next/Previous, rest/hover/focus and selected parent/page/reduced-motion. Earlier1.9 scope remains linked; no new94-state image review claimed.

## job-card — Job list card

Aliases: My Jobs, job card, View job, job title, badge position, Creator, Agreed price, Deadline

Selectors: .job-card, .result-heading

Consumers: US-025

Source: US-025/demo/screen.mjs, US-025/demo/screen.css

Record: [book/records/job-card.json](records/job-card.json)

Current review: Independent normal composition across all94 named states in both themes/mobile/desktop, plus selected native child/parent/page and stress/live scopes. Individual captured-only pixels remain unvisited; see1.9 coverage.

## job-overview — Job overview and status panel

Aliases: survey, survey count, Job overview, Work has started, Ready to start, price, brief

Selectors: .context-card, .action-panel, .job-summary

Consumers: US-025, US-027, US-028

Source: US-025/demo/screen.mjs, US-025/demo/screen.css

Record: [book/records/job-overview.json](records/job-overview.json)

Current review: Independent normal composition across all94 named states in both themes/mobile/desktop, plus selected native child/parent/page and stress/live scopes. Individual captured-only pixels remain unvisited; see1.9 coverage.

## proof-workspace — Proof workspace

Aliases: Add proof, proof form, Delivery URL, Saved proof, empty proof, add another, merged form, compact entry

Selectors: .proof-workspace, .proof-dialog, #proof-form

Consumers: US-026

Source: US-026/demo/screen.mjs, US-026/demo/screen.css, US-026/demo/state-machine.mjs

Record: [book/records/proof-workspace.json](records/proof-workspace.json)

Current review: Independent normal composition across all94 named states in both themes/mobile/desktop, plus selected native child/parent/page and stress/live scopes. Individual captured-only pixels remain unvisited; see1.9 coverage.

## proof-header — Proof page heading

Aliases: Campus Dining, job eyebrow, Proof of delivery, In Progress, Share evidence

Selectors: .story-heading, .job-identity

Consumers: US-026

Source: US-026/demo/screen.mjs, US-026/demo/screen.css

Record: [book/records/proof-header.json](records/proof-header.json)

Current review: Independent normal composition across all94 named states in both themes/mobile/desktop, plus selected native child/parent/page and stress/live scopes. Individual captured-only pixels remain unvisited; see1.9 coverage.

## evidence-link — Delivery evidence link and type

Aliases: URI, URL, external link, line break, Proof badge, distribution-report, attachment

Selectors: .cu-attachment, .cu-evidence-link

Consumers: US-026, US-027

Source: theme/components.mjs, theme/recipes.css, US-026/demo/screen.mjs, US-027/demo/screen.mjs

Record: [book/records/evidence-link.json](records/evidence-link.json)

Current review: Independent normal composition across all94 named states in both themes/mobile/desktop, plus selected native child/parent/page and stress/live scopes. Individual captured-only pixels remain unvisited; see1.9 coverage.

## jobs-entry — Proof return-to-jobs entry

Aliases: jobs placeholder, Open delivery evidence, My Jobs entry, badge button gap

Selectors: .jobs-placeholder

Consumers: US-026

Source: US-026/demo/screen.mjs, US-026/demo/screen.css

Record: [book/records/jobs-entry.json](records/jobs-entry.json)

Current review: Independent normal composition across all94 named states in both themes/mobile/desktop, plus selected native child/parent/page and stress/live scopes. Individual captured-only pixels remain unvisited; see1.9 coverage.

## dialog — Dialog frame and actions

Aliases: modal, popup, confirmation, question title, panel too large, close, Got it

Selectors: dialog.cu-content-dialog, .cu-close

Consumers: US-025, US-026, US-027, US-028, US-034

Source: theme/components.mjs, theme/recipes.css, US-025/demo/screen.mjs, US-025/demo/screen.css, stories/runtime.mjs, stories/screen.css

Record: [book/records/dialog.json](records/dialog.json)

Current review: Independent normal composition across all94 named states in both themes/mobile/desktop, plus selected native child/parent/page and stress/live scopes. Individual captured-only pixels remain unvisited; see1.9 coverage.

## pending-operation — Pending operation and background recovery

Aliases: loading, stuck, background, timeout, cancel, rollback, pending, close confirmation, offline Start

Selectors: .cu-operation, .cu-loading-layout

Consumers: US-025, US-026, US-027, US-028, US-034

Source: US-025/demo/state-machine.mjs, US-025/demo/screen.mjs, US-026/demo/state-machine.mjs, US-026/demo/screen.mjs, stories/runtime.mjs, US-027/demo/state-machine.mjs, US-028/demo/state-machine.mjs, theme/operations.mjs

Record: [book/records/pending-operation.json](records/pending-operation.json)

Current review: Independent normal composition across all94 named states in both themes/mobile/desktop, plus selected native child/parent/page and stress/live scopes. Individual captured-only pixels remain unvisited; see1.9 coverage.

## recovery-page — Unavailable, loading and recovery page

Aliases: not found, access removed, Session expired, Try again, plain, bottom nav shifted, error page

Selectors: .unavailable-state, .notice

Consumers: US-025, US-026, US-027, US-028, US-034

Source: US-025/demo/screen.mjs, US-026/demo/screen.mjs, stories/runtime.mjs, stories/screen.css

Record: [book/records/recovery-page.json](records/recovery-page.json)

Current review: Independent normal composition across all94 named states in both themes/mobile/desktop, plus selected native child/parent/page and stress/live scopes. Individual captured-only pixels remain unvisited; see1.9 coverage.

## completion-checklist — Completion requirements and evidence

Aliases: checkmark, green check, requirements, content heading, Delivery evidence, No proof added

Selectors: .criteria

Consumers: US-027

Source: US-027/demo/screen.mjs, stories/screen.css

Record: [book/records/completion-checklist.json](records/completion-checklist.json)

Current review: Independent normal composition across all94 named states in both themes/mobile/desktop, plus selected native child/parent/page and stress/live scopes. Individual captured-only pixels remain unvisited; see1.9 coverage.

## pagination — Review pagination

Aliases: previous, first page, page 1, next, rating filter

Selectors: .list-pagination, .pagination

Consumers: US-025, US-026, US-027, US-028, US-034

Source: US-034/demo/screen.mjs, stories/screen.css, theme/recipes.css, theme/theme.json, stories/pagination-check.cjs

Record: [book/records/pagination.json](records/pagination.json)

Current review: 1.9.1 focused compact pager review: both hosts/themes at390/1440/2560, Next/Previous, rest/hover/focus and selected parent/page/reduced-motion. Earlier1.9 scope remains linked; no new94-state image review claimed.

## minimal-copy — Minimal copy and hierarchy

Aliases: description, verbose, paragraph, reminder, instruction, font, text wrap

Selectors: See owning page source

Consumers: US-025, US-026, US-027, US-028, US-034

Source: US-025/demo/screen.mjs, US-026/demo/screen.mjs, US-027/demo/screen.mjs, US-028/demo/screen.mjs, US-034/demo/screen.mjs

Record: [book/records/minimal-copy.json](records/minimal-copy.json)

Current review: Independent normal composition across all94 named states in both themes/mobile/desktop, plus selected native child/parent/page and stress/live scopes. Individual captured-only pixels remain unvisited; see1.9 coverage.

## us025-list — My Jobs list

Aliases: US-025, US025

Selectors: See owning page source

Consumers: US-025

Source: US-025/demo/screen.mjs

Record: [book/records/us025-list.json](records/us025-list.json)

Current review: 1.9.1 focused compact pager review: both hosts/themes at390/1440/2560, Next/Previous, rest/hover/focus and selected parent/page/reduced-motion. Earlier1.9 scope remains linked; no new94-state image review claimed.

## us025-detail — Job details and lifecycle

Aliases: US-025, US025

Selectors: See owning page source

Consumers: US-025

Source: US-025/demo/screen.mjs

Record: [book/records/us025-detail.json](records/us025-detail.json)

Current review: Independent normal composition across all94 named states in both themes/mobile/desktop, plus selected native child/parent/page and stress/live scopes. Individual captured-only pixels remain unvisited; see1.9 coverage.

## us025-dialog — Start confirmation and pending operation

Aliases: US-025, US025

Selectors: See owning page source

Consumers: US-025

Source: US-025/demo/screen.mjs

Record: [book/records/us025-dialog.json](records/us025-dialog.json)

Current review: Independent normal composition across all94 named states in both themes/mobile/desktop, plus selected native child/parent/page and stress/live scopes. Individual captured-only pixels remain unvisited; see1.9 coverage.

## us026-proof — Proof of delivery workspace

Aliases: US-026, US026, Proof of delivery

Selectors: See owning page source

Consumers: US-026

Source: US-026/demo/screen.mjs

Record: [book/records/us026-proof.json](records/us026-proof.json)

Current review: Independent normal composition across all94 named states in both themes/mobile/desktop, plus selected native child/parent/page and stress/live scopes. Individual captured-only pixels remain unvisited; see1.9 coverage.

## us027-completion — Job completion and its dialogs

Aliases: US-027, US027, Job completion

Selectors: See owning page source

Consumers: US-027

Source: US-027/demo/screen.mjs

Record: [book/records/us027-completion.json](records/us027-completion.json)

Current review: Independent normal composition across all94 named states in both themes/mobile/desktop, plus selected native child/parent/page and stress/live scopes. Individual captured-only pixels remain unvisited; see1.9 coverage.

## us028-cancellation — Job cancellation

Aliases: US-028, US028, Cancel job

Selectors: See owning page source

Consumers: US-028

Source: US-028/demo/screen.mjs

Record: [book/records/us028-cancellation.json](records/us028-cancellation.json)

Current review: Independent normal composition across all94 named states in both themes/mobile/desktop, plus selected native child/parent/page and stress/live scopes. Individual captured-only pixels remain unvisited; see1.9 coverage.

## us034-reviews — Marketer profile and verified reviews

Aliases: US-034, US034, Marketer reviews

Selectors: See owning page source

Consumers: US-034

Source: US-034/demo/screen.mjs

Record: [book/records/us034-reviews.json](records/us034-reviews.json)

Current review: 1.9.1 focused compact pager review: both hosts/themes at390/1440/2560, Next/Previous, rest/hover/focus and selected parent/page/reduced-motion. Earlier1.9 scope remains linked; no new94-state image review claimed.

## design-book — Design book and handoff entry

Aliases: book, search, component catalog, documentation, evidence gallery, source of truth, visited, unvisited, review history

Selectors: See owning page source

Consumers: Design-book/library utilities

Source: book/index.html, book/app.mjs, book/book.css, book/catalog.json, book/validate.mjs, index.html, book/build-index.mjs, stories/consistency-check.cjs, stories/iteration4-regressions.cjs, tools/ui/engine.cjs, tools/ui/cli.cjs, tools/ui/contracts.json, tools/ui/changes.cjs

Record: [book/records/design-book.json](records/design-book.json)

Current review: Root handoff/author controls inspected and graph/index validated. Book viewer CSS unchanged; portable navigation/loading verified separately, no new blanket viewer visual approval.

## status-placement — Entity status heading

Aliases: badge position, top right, Pending, In Progress, Accepted

Selectors: .cu-status-heading

Consumers: US-025, US-026, US-027, US-028, US-034

Source: theme/recipes.css, stories/runtime.mjs, US-025/demo/screen.mjs, US-026/demo/screen.mjs, theme/components.mjs, theme/theme.json

Record: [book/records/status-placement.json](records/status-placement.json)

Current review: Independent normal composition across all94 named states in both themes/mobile/desktop, plus selected native child/parent/page and stress/live scopes. Individual captured-only pixels remain unvisited; see1.9 coverage.

## empty-state — Empty list and filtered-result composition

Aliases: No active jobs, board icon, empty reviews, no matches

Selectors: .empty-state, .empty

Consumers: US-025, US-026, US-027, US-028, US-034

Source: US-025/demo/screen.mjs, US-025/demo/screen.css, US-034/demo/screen.mjs, stories/screen.css

Record: [book/records/empty-state.json](records/empty-state.json)

Current review: Independent normal composition across all94 named states in both themes/mobile/desktop, plus selected native child/parent/page and stress/live scopes. Individual captured-only pixels remain unvisited; see1.9 coverage.

## review-list — Verified review history and filters

Aliases: Verified reviews, review card, Filter by rating, review spacing, review layout

Selectors: .review-history-card, .review-history-heading

Consumers: US-034

Source: US-034/demo/screen.mjs, stories/screen.css, stories/runtime.mjs

Record: [book/records/review-list.json](records/review-list.json)

Current review: 1.9.1 focused compact pager review: both hosts/themes at390/1440/2560, Next/Previous, rest/hover/focus and selected parent/page/reduced-motion. Earlier1.9 scope remains linked; no new94-state image review claimed.

## review-comment — Long review disclosure

Aliases: long comment, Read full review, Read more, Show less, Thai review, expand

Selectors: .review-comment

Consumers: US-034

Source: US-034/demo/screen.mjs, US-034/demo/state-machine.mjs, stories/runtime.mjs, stories/screen.css

Record: [book/records/review-comment.json](records/review-comment.json)

Current review: Independent normal composition across all94 named states in both themes/mobile/desktop, plus selected native child/parent/page and stress/live scopes. Individual captured-only pixels remain unvisited; see1.9 coverage.

## rating-summary — Rating summary and distribution

Aliases: ratings, stars, rating bars, 5 star, histogram, distribution color

Selectors: .rating-summary, .distribution

Consumers: US-034

Source: US-034/demo/screen.mjs, stories/screen.css, theme/theme.json

Record: [book/records/rating-summary.json](records/rating-summary.json)

Current review: Independent normal composition across all94 named states in both themes/mobile/desktop, plus selected native child/parent/page and stress/live scopes. Individual captured-only pixels remain unvisited; see1.9 coverage.

## cancellation-task — Cancellation effects and contract summary

Aliases: Cancel job, Cancellation effects, Contract summary, effect list, contract spacing

Selectors: .cancellation-layout, .contract-summary

Consumers: US-028

Source: US-028/demo/screen.mjs, stories/screen.css

Record: [book/records/cancellation-task.json](records/cancellation-task.json)

Current review: Independent normal composition across all94 named states in both themes/mobile/desktop, plus selected native child/parent/page and stress/live scopes. Individual captured-only pixels remain unvisited; see1.9 coverage.

## Shared API call sites

Generated from resolved compiler symbols, including aliases/re-exports/wrappers and inline scripts. Query `node "UX UI/tools/ui/cli.cjs" ui:inspect Action` or `ui:affected Accepted` for parameters, recipes/tokens and potential reverse dependencies. Conditional/dynamic execution still needs rendered checks. See `tools/ui/README.md` for limits.

- action: stories/library.mjs:6, stories/library.mjs:6, stories/runtime.mjs:4, stories/studio.mjs:10, stories/studio.mjs:10, stories/studio.mjs:10, theme/color-review.html:5, theme/color-review.html:5, theme/color-review.html:5, theme/color-review.html:5, theme/color-review.html:5, theme/color-review.html:5, theme/lab.mjs:17, theme/lab.mjs:17, theme/lab.mjs:17, theme/lab.mjs:17, theme/lab.mjs:17, theme/lab.mjs:17, theme/lab.mjs:17, theme/lab.mjs:17, theme/lab.mjs:17, theme/lab.mjs:17, theme/lab.mjs:17, theme/static-components.mjs:8, US-025/demo/screen.mjs:438, US-025/demo/screen.mjs:350, US-025/demo/screen.mjs:352, US-025/demo/screen.mjs:361, US-025/demo/screen.mjs:366, US-025/demo/screen.mjs:323, US-025/demo/screen.mjs:483, US-025/demo/screen.mjs:487, US-025/demo/screen.mjs:487, US-025/demo/screen.mjs:431, US-025/demo/screen.mjs:457, US-026/demo/screen.mjs:162, US-026/demo/screen.mjs:217, US-026/demo/screen.mjs:203, US-027/demo/screen.mjs:19, US-027/demo/screen.mjs:23
- attachmentTag: theme/color-review.html:5, US-026/demo/screen.mjs:158, US-027/demo/screen.mjs:24
- backLink: stories/runtime.mjs:69, theme/color-review.html:5, theme/lab.mjs:17, theme/static-components.mjs:8, US-025/demo/screen.mjs:474, US-025/demo/screen.mjs:380, US-025/demo/screen.mjs:292, US-025/demo/screen.mjs:293, US-026/demo/screen.mjs:218, US-026/demo/screen.mjs:204, US-026/demo/screen.mjs:211, US-026/demo/screen.mjs:208, US-026/demo/screen.mjs:214
- badge: No direct scoped consumer
- banner: theme/color-review.html:5, theme/lab.mjs:14, US-025/demo/screen.mjs:336, US-026/demo/screen.mjs:169, US-026/demo/screen.mjs:180, US-026/demo/screen.mjs:183, US-026/demo/screen.mjs:191
- bottomBar: stories/runtime.mjs:53, theme/lab.mjs:17, US-025/demo/screen.mjs:288, US-026/demo/screen.mjs:229
- brand: theme/lab.mjs:75, US-026/demo/author.mjs:56
- closeControl: stories/runtime.mjs:13, US-025/demo/screen.mjs:483, US-025/demo/screen.mjs:487, US-026/demo/screen.mjs:162
- esc: book/app.mjs:38, book/app.mjs:20, book/app.mjs:12, book/app.mjs:16, book/app.mjs:18, book/app.mjs:6, book/app.mjs:47, book/app.mjs:43, stories/library.mjs:6, stories/runtime.mjs:5, stories/runtime.mjs:4, stories/runtime.mjs:13, stories/runtime.mjs:6, stories/runtime.mjs:11, stories/runtime.mjs:12, stories/runtime.mjs:69, stories/studio.mjs:8, stories/studio.mjs:10, stories/studio.mjs:17, theme/lab.mjs:58, theme/lab.mjs:60, theme/static-components.mjs:7, US-025/demo/screen.mjs:410, US-025/demo/screen.mjs:445, US-025/demo/screen.mjs:354, US-025/demo/screen.mjs:297, US-025/demo/screen.mjs:507, US-025/demo/screen.mjs:323, US-025/demo/screen.mjs:387, US-025/demo/screen.mjs:487, US-025/demo/screen.mjs:402, US-026/demo/screen.mjs:174, US-026/demo/screen.mjs:162, US-026/demo/screen.mjs:217, US-026/demo/screen.mjs:158, US-027/demo/screen.mjs:14, US-027/demo/screen.mjs:19, US-028/demo/screen.mjs:14, US-034/demo/screen.mjs:10, US-034/demo/screen.mjs:8, US-034/demo/screen.mjs:13, US-034/demo/screen.mjs:18
- evidenceLink: theme/color-review.html:5, US-026/demo/screen.mjs:158, US-026/demo/screen.mjs:166, US-027/demo/screen.mjs:24
- feedbackBlock: stories/runtime.mjs:14, theme/lab.mjs:14, theme/lab.mjs:17, US-025/demo/screen.mjs:427, US-025/demo/screen.mjs:333, US-025/demo/screen.mjs:335, US-025/demo/screen.mjs:493, US-025/demo/screen.mjs:458, US-026/demo/screen.mjs:185, US-026/demo/screen.mjs:188, US-026/demo/screen.mjs:189, US-026/demo/screen.mjs:193, US-026/demo/screen.mjs:196
- fitCompactNavigation: US-025/demo/screen.mjs:941, US-025/demo/screen.mjs:942
- headerBar: stories/runtime.mjs:69, theme/lab.mjs:17, US-025/demo/screen.mjs:280, US-026/demo/screen.mjs:139
- headerControl: No direct scoped consumer
- icon: stories/library.mjs:8, theme/lab.mjs:74, theme/lab.mjs:75, theme/lab.mjs:78, US-025/demo/screen.mjs:463, US-025/demo/screen.mjs:354, US-025/demo/screen.mjs:337, US-025/demo/screen.mjs:327, US-025/demo/screen.mjs:487, US-025/demo/screen.mjs:911, US-026/demo/screen.mjs:162, US-026/demo/screen.mjs:157, US-026/demo/screen.mjs:214, US-027/demo/screen.mjs:14, US-027/demo/screen.mjs:21, US-027/demo/screen.mjs:24, US-028/demo/screen.mjs:14, US-034/demo/screen.mjs:21, US-034/demo/screen.mjs:23
- keepFocusVisible: stories/runtime.mjs:18, US-025/demo/screen.mjs:10, US-026/demo/screen.mjs:23
- lifecycleBadge: stories/runtime.mjs:11, stories/runtime.mjs:12, theme/color-review.html:5, theme/color-review.html:5, theme/color-review.html:5, theme/color-review.html:5, theme/lab.mjs:14, theme/lab.mjs:14, theme/lab.mjs:14, theme/lab.mjs:14, US-025/demo/screen.mjs:445, US-025/demo/screen.mjs:323, US-026/demo/screen.mjs:174, US-026/demo/screen.mjs:217
- loadingScaffold: stories/runtime.mjs:69, US-026/demo/screen.mjs:208
- menuItem: stories/runtime.mjs:69, stories/runtime.mjs:69, theme/lab.mjs:17, US-025/demo/screen.mjs:284, US-026/demo/screen.mjs:138
- navItem: stories/runtime.mjs:53, theme/lab.mjs:17, theme/lab.mjs:21, US-025/demo/screen.mjs:271, US-026/demo/screen.mjs:128, US-026/demo/screen.mjs:129, US-026/demo/screen.mjs:130, US-026/demo/screen.mjs:131, US-026/demo/screen.mjs:132, US-026/demo/screen.mjs:223, US-026/demo/screen.mjs:224, US-026/demo/screen.mjs:225, US-026/demo/screen.mjs:226, US-026/demo/screen.mjs:227
- observeCompactNavigation: stories/runtime.mjs:70, US-025/demo/screen.mjs:541, US-026/demo/screen.mjs:237
- observeNavigationTile: stories/runtime.mjs:70, theme/lab.mjs:23, US-025/demo/screen.mjs:540, US-026/demo/screen.mjs:239
- operationNotice: stories/runtime.mjs:68, US-025/demo/screen.mjs:492, US-026/demo/screen.mjs:170
- positionNavigationTile: theme/lab.mjs:28, US-025/demo/screen.mjs:941, US-025/demo/screen.mjs:942
- roleBirds: theme/lab.mjs:75, US-026/demo/author.mjs:58
- verificationBadge: US-034/demo/screen.mjs:13
