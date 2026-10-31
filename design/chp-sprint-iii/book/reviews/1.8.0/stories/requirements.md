# Independent review requirements · iteration 4

Prepared before implementation/render review from the latest human comments, project instructions and existing accepted scope. This is a checklist, not a verdict on the implementation.

## Required comparisons

- Keep the pink main/blue secondary identity and consistency; the new request explicitly permits broader restrained semantic/tertiary/quaternary color proposals. Judge Light/Dark text, icon, fill, boundary and adjacent action contrast/saturation in context. Human color acceptance remains pending.
- Shared banner structure must align title/body/icon and recovery controls coherently across success, neutral/info, warning and failure. Avoid a visually indistinguishable message/action pair. Retain consequential uncertainty and recovery copy.
- Content-origin popups/dialogs dim/blur or otherwise separate their backdrop consistently, with accessible reduced-transparency behavior. Main-layout hamburger/attached navigation keeps its existing unblurred behavior.
- One atomic borderless-at-rest X close control across dialogs; visible keyboard/pointer feedback remains. Avoid duplicate same-effect Continue browsing and X controls in pending dialogs. Closing must not pretend to undo an already dispatched request; reopening/result/reconciliation must remain available.
- US026 Add proof opens an overlay prompt rather than expanding/moving saved rows. Verify focus entry/trap/Escape/close/return, retained draft, validation, unknown outcome, save resolution, navigation and dismissal while pending. Empty icon/text align to the same first line; workspace must avoid excessive hollow spacing.
- Headings retain consistent intrinsic anchors across normal/loading/recovery screens; do not freeze coordinates across different screen widths. Check US025 list/recovery and unavailable cards across all consumers.
- Header stays sticky during normal scrolling. At very short/enlarged sizes preserve access to content and navigation with an explicit, justified fallback if necessary.
- Long list titles/comments use bounded previews and accessible navigation/disclosure to complete text. Don’t silently remove the complete title on its details destination or break Unicode.
- US027 blocker dialog title and action hierarchy, evidence badge/link/time rhythm, US028 success copy, and US034 history heading/filter balance need close/parent/page inspection.
- Pagination uses restrained borderless/low-border controls with clear previous/next direction, comfortable target and visible hover/focus. First/last unavailable controls remain omitted.
- Initial loading should resemble the actual destination composition where helpful, retain context on refresh, avoid fictional loaded values and always offer an exit/recovery path.

## US034 Job reference / permissions evidence

The story/model requires a linked `job_id`, rating, optional comment and date; it does not establish public access to contract details. Existing demo `screen.mjs` turns Job # into a public local modal containing only generic completed-work text. That modal is a design invention, not evidence of a public product route.

Read-only current contract evidence:

- `cu-ways-backend/docs/openapi.yaml` `/api/v1/jobs/{id}` GET, lines about 1002–1043: authenticated active Creator membership **and job ownership** are required; 401/403 are specified.
- `cu-ways-backend/internal/services/job_service.go` `GetJob`: calls `requireCreator`, validates positive ID and requests `GetJobByCreator(ctx, actor.UserID, jobID)`.
- `cu-ways-backend/internal/repositories/postgres/job_repo.go` creator-scoped repository; integration tests prove foreign-owner rejection in their own scope.
- `cu-ways-frontend/src/features/marketer-discovery/types.ts`: `MarketerReview` has review_id, rating, comment and reviewer_name; no job destination/authorization flag.
- `cu-ways-frontend/src/features/marketer-discovery/components/marketer-review-card.tsx`: current review component has no Job button.

Supported design choice is a noninteractive Job # reference on the public review, preserving provenance without advertising inaccessible details. A future participant-only link needs explicit authorization/destination data. Neither demo fixtures nor this read-only inspection proves runtime application permissions or requires changing either application repository.

## Evidence scope

Read project AGENTS/workflow/book principles/capture contract, selected Round10 direction and desktop reference, current frontend mobile reference, and owning component records. Later explicit human corrections override Round10 details. Preserve Figma/SVG and both application repositories.

When the root freezes candidate sources, capture hashes and actual rendered state IDs; inspect component close views plus parent/sibling/page context in both themes at mobile/desktop, relevant 320/200%, short and large layouts, keyboard/pointer states and transparency/motion fallbacks. Preserve failures/retakes separately. No capture-only or automated pass is visual approval.
