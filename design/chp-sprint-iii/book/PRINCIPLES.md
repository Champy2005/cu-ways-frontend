# Project UX/UI principles

These principles restate the human's current direction. They override older demo defaults where they conflict. Use the selected Round 10 and current frontend as comparison inputs, with later human corrections taking precedence.

## Priorities

1. Consistency across components, states and stories.
2. Appropriate composition, alignment, layout, sizing, positioning and minimalism.
3. Ease of navigation, input, feedback and learning, with few unnecessary steps.
4. Aesthetics, color, tone, contrast and visibility. These still matter; propose and inspect them carefully. The human retains final color judgment.

## Change and review as a whole

Before editing, find the owning record and inspect its current implementation, related states and consumers. A component change must be judged at three levels: its own children, its parent/siblings, and the page. A tidy isolated element is insufficient if it damages the surrounding composition.

Capture the changed component closely enough to judge its padding, gaps, text, alignment, controls and states. Also capture its parent and whole page. Reuse the same identifiable capture set for light/dark, mobile/desktop, relevant large displays, enlarged text and keyboard/fallback states. Inspect the actual images, then update the record. After a material repair, retake the affected evidence. Do not relabel an old image as current.

Use a fresh independent reviewer before handoff. Give them the requirements, human guidance and references rather than the implementer's verdict. Evaluate each finding against source and renders; record accepted repairs or a supported reason for declining it. Functional checks and a reviewer's lack of findings do not establish human acceptance.

## Minimal, meaningful copy

Do not repeat an obvious title, status or action in a description. Keep copy that explains a consequence, unresolved result, permission, validation requirement or meaningful next step. Extra space alone does not require filler. A short complementary description can help a sparse component, but crowded components should lose low-value copy first.

Avoid paragraph-like instructions in product UI. Prefer a short statement, compact list, or a deliberately subordinate text style. Preserve the meaning of important warnings. Use balanced wrapping and intrinsic layout rather than shrinking all text or adding arbitrary line breaks to match one screenshot.

## Responsive components

Choose bounded responsive sizes and breakpoints from content and input needs. Review mobile, normal desktop and the human's large 2560px CSS viewport; check larger displays when changing the scale system. Preserve explicit text enlargement and comfortable targets. A larger viewport must not leave every useful control tiny, and a narrow viewport must not become a full-width modal by accident.

## Loading must stay escapable

A request must not trap the user in a blocking modal or loading screen indefinitely. Provide dismissal/navigation and a visible way to revisit or reconcile the operation. Keep a background result available when the user continues working.

Before dispatch, cancellation may simply close the draft. After dispatch, closing UI must not pretend to undo a committed or ambiguous operation. Continue its operation state, prevent duplicate writes, and show success, failure or uncertainty when known. Use a bounded timeout and read/recovery path when a response stalls. Only promise rollback or cancellation when the underlying contract supports it. No user should have to restart the app to escape a pending presentation.

## Durable records

After editing and reviewing, update the existing component/page record with the decision, exact source, relevant parameter references, child/parent/page captures, inspected scope and unresolved questions. Mark untouched components or scenarios as **unvisited / awaiting review**. Keep shared inheritance distinct from human review of a complete page.

Preserve history and evidence boundaries. Fictional demos are design evidence; they do not prove actual API permissions, cancellation, concurrency, payment behavior or durable persistence. Frontend adoption remains a separate task.

## Latest color, overlay and lookup guidance

Color work may expand the supporting palette while retaining pink primary and blue secondary. Assign semantic roles, keep neutral structure, judge contrast/saturation/tone in real parent/page compositions and retain a reversible baseline. Quiet dismissal, close controls and pagination should not look like raised primary controls. Human palette judgment remains pending until explicitly accepted.

The human rejected purple/violet. Current supporting actions use slate-blue and progress uses muted blue-teal; the replacement remains pending human acceptance. Quiet content text hover never fills a button box. Useful task/recovery actions have visible boundaries; safe alternatives are outlined above the final critical confirmation when stacked. Content More keeps a visible reserved target. Do not add fade animations or hide controls until hover.

Content-origin prompts use a shared dim/blur modal layer and a borderless close X; layout-origin hamburger and navigation menus keep their attached behavior. Reduced transparency uses an opaque scrim. When close and Continue browsing do the same pending-dismiss operation, keep one control; background work and uncertain results still require a visible revisit/recovery path.

Long list names can use ellipsis if a real detail destination reveals the full text. Optional lengthy comments can use disclosure. Do not truncate validation, irreversible consequences or other critical information. Initial loading should preserve the destination page structure without fabricated facts or blocked navigation.

Prefer the generated component/source/consumer index and canonical JSON records as a small machine-searchable database. The human viewer is optional. Do not spend effort polishing documentation presentation. Regenerate/check the lookup and run rendered consistency checks so a global component change reaches every actual consumer.

Use the implemented UI context CLI before shared edits and validate afterward. Compiler-resolved calls plus CSS/token edges supply potential scope; actual route receipts distinguish checked routes from unvisited ones. A database, a stale map or green geometry alone cannot establish visual consistency or human approval.

Compact arrow pagination has a named exception to quiet text hover: enabled icons show a soft tonal circle with a fine inset edge. Rest stays borderless, geometry stable, focus visible and touch/reduced-motion behavior appropriate.
