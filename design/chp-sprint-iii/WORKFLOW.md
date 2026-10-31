# HTML-first UX/UI workflow

## Required design-book workflow

Start with [book/README.md](book/README.md) and [the human principles](book/PRINCIPLES.md). Search the owning component/page record before editing. Record the proposed decision, change the canonical source, then inspect and capture the component, its parent/siblings and the page. Cover relevant themes, responsive sizes, interactions and fallbacks. Re-review affected captures after repairs and update the same record with parameters, source identities, evidence and remaining human review. Keep unvisited states explicitly unvisited. Independent inspection does not grant human color acceptance. The priorities and nonblocking-loading rules in the book supersede older demo defaults.

Use the [UI context CLI](tools/ui/README.md) before a global fix: `ui:inspect` resolves visible aliases to canonical owner/parameters/tokens; `ui:affected` enumerates direct/transitive code and potential shared-style routes. Preserve affected sources, edit canonical owners, run `ui:build`, then `ui:validate` with the preserved baseline. Its report contains actual hashes, changed token/effect values, unknown scope and actual runtime checks. The [component index](book/INDEX.md) combines compiler calls with canonical records. Regenerate it after records change; `book/validate.mjs` also rejects stale graph/ownership violations. Inspect and capture affected child/parent/page after gates. A passed contract is not aesthetic acceptance.

**Current design revision:** CU Ways Rose × Slate 1.9.1. The [rendered review record](REVIEW.md) describes its verified scope and limits. The workspace handoff starts at [index.html](index.html). Use the HTML workbench and story demonstrations as the editable, interactive design handoff. Do not dismiss the selected Round 10 appearance as historical during visual comparison; use its [latest direction notes](US-025/color-playground/ROUND-10.md) and latest artifacts when intermediate screenshots disagree. Keep Figma/SVG read-only unless the user explicitly authorizes edits.

## Open and serve the handoff

From the CUWAY workspace, run:

```powershell
node "UX UI/serve.mjs"
```

This starts the local static server on port 4175. If that port is occupied, pass another port, for example `node "UX UI/serve.mjs" --port 4177`. Open the server's root page, [UX UI/index.html](index.html). The server has no external service or application API connection.

To make the portable handoff bundle, run `node "UX UI/package-handoff.mjs"` from the workspace. It writes the versioned HTML handoff bundle. Extract the bundle and run `node serve.mjs` from its root. The bundle contains the current HTML handoff, shared sources and all five Chp story demo models; it excludes the application repositories and the archived US-026 SVG export. A local theme draft is not promoted to the canonical theme by packaging.

The entry page links to the shared system and the five Chp-assigned Sprint III UX/UI stories:

- [Shared theme and component lab](theme/lab.html): edit Light/Dark previews and save a browser-local proposal.
- [US-025 interactive story demo](US-025/demo/index.html): explore the story's 41 defined states with the shared theme components and local mock behavior.
- [US-026 interactive story demo](US-026/demo/index.html): explore the story's 14 defined states with shared components and local mock behavior. The older Figma/SVG export remains read-only source material.
- [US-027 completion warning](US-027/demo/index.html): 14 states including missing Proof and US031 prerequisites.
- [US-028 cancellation](US-028/demo/index.html): 15 states including confirmation, Paid/Completed guards and recovery.
- [US-034 verified reviews](US-034/demo/index.html): 10 states including rating summaries, filters and genuine no-rating states.

The three added Chp stories share `stories/studio.mjs`, `stories/runtime.mjs` and intrinsic task-composition styles. Each story owns its `model/scenarios.json`, state machine and screen composition. Regenerate its browser model with `node "UX UI/stories/build.mjs"`; validate with `--check`. Domain checks: `node --test "UX UI/stories/chp.behavior.test.mjs"`. Browser evidence and independent review have separate status in [stories/REVIEW.md](stories/REVIEW.md).

## Source of truth and inheritance

The canonical reusable visual source is [theme.json](theme/theme.json). It defines shared parameters, Light and Dark values, semantic color derivations, preferences and open decisions. The theme build generates `source.mjs`, `tokens.css`, `resolved-tokens.json` and [REFERENCE.md](theme/REFERENCE.md). Treat those generated files as projections; edit the source and regenerate them.

[components.mjs](theme/components.mjs) creates the actual shared action, feedback, navigation, status and icon markup. [recipes.css](theme/recipes.css) styles those primitives. The global lab and US-025 and US-026 story demonstrations consume the same module and generated tokens. Story CSS owns the host's content layout; it must not copy a demo's positions or viewport coordinates as global rules.

New stories inherit in this order: global parameters → theme semantic values → shared component recipes → story/feature specialization → page or instance choice. Story requirements still own their behavior, copy, routes, permissions and content. A story record may propose local `layout.*`, `component.*` or `semantic.*` aliases, but it does not load or apply those aliases. The story host must deliberately map each approved alias in its own code or CSS. Keep page layout content-driven and intrinsic; shared component measurements do not prescribe page coordinates. See [specialization rules](theme/SPECIALIZATION.md).

The theme lab stores validated, base-versioned drafts in this browser's local storage. It applies draft values to the previews and can export JSON or preview CSS. It does not write `theme.json`, generate canonical files or update a story source. Promote a reviewed decision by editing the canonical source and regenerating its projections.

## Build a future story handoff

1. Start from accepted story requirements and verified current interfaces. Keep behavior, routes, permissions and copy in that story's own record.
2. Choose shared semantic roles from the component reference. Use anchors for navigation and buttons for operations. Use `banner` for message-only feedback and `feedbackBlock` for message-associated recovery controls. Keep those controls outside the painted live region. Primary task actions remain in their task panel/tray.
3. Build the story preview with the shared theme tokens, `components.mjs` markup and `recipes.css`. Let the story own its content-driven layout. Keep scenario definitions and mock transitions in an explicit story model rather than embedding state into visual coordinates.
4. Record any justified local alias, its inherited source, owner and reason. Bind it explicitly in the story host and validate it there; a decision record alone changes no runtime behavior.
5. Review both themes, keyboard and pointer behavior, text enlargement, narrow and short layouts, reduced motion and reduced transparency. Treat the preview as design evidence, not proof of application permissions, APIs, persistence or backend behavior.

## Rendered visual review

1. Render the changed HTML in Light and Dark at the accepted desktop and mobile sizes, plus the relevant short-height, enlarged-text, keyboard-focus and menu states. Capture the actual result, not only the theme lab or source markup.
2. Ask a fresh, unbiased reviewer to compare those renders with the explicit user decisions, accepted story cases, selected Round 10 appearance and inspected frontend. Provide the requirements and references without the implementer's assessment or expected verdict.
3. The root evaluates each reported issue against the requirements, source and rendered evidence. Accept supported findings that improve the requested outcome. Decline inaccurate, speculative, out-of-scope or subjective suggestions when appropriate, recording the reason and relevant evidence. Review is an independent input to the root’s design judgment, not a requirement for unanimity or for applying every suggestion.
4. Re-render and repeat the independent review after material visual repairs. A green functional or accessibility check does not by itself approve visual fidelity.

The current revision and its rendered review are recorded in REVIEW.md; earlier feedback and baseline reviews are retained separately. See [REVIEW.md](REVIEW.md). Future material changes require the same process. This records local design evidence, not application adoption or blanket approval of future compositions.

## Historical work and boundaries

All five Chp-assigned Sprint III stories have interactive HTML demos and canonical `model/scenarios.json` sources. The selected Round 10 appearance remains a required visual-comparison input; later user corrections take precedence. Preserve the US-026 Figma/SVG material read-only unless the user authorizes edits. New story renders require independent review; either application's implementation remains separate work. Do not treat a demo's use of theme 1.9.0 as proof of application adoption.

Existing Figma and SVG material is read-only history for this workflow. Do not import, edit, export into, or otherwise operate on Figma unless the user explicitly reauthorizes that work. The HTML demos use fictional/local fixtures and mock outcomes; they make no application API calls and provide no product persistence evidence.

Focused protection for repeated rendered defects: with the HTML server running, use `node "UX UI/stories/visual-regressions.cjs"` (optional `CUWAYS_STORY_ORIGIN`). It checks upper-right lifecycle alignment, actual Tab clearance, independent review-context spacing, disclosure/filter behavior and enlarged history bounds. Its passing result is behavior/geometry evidence; still inspect and capture each changed component and surrounding composition.

Exhaustive design checks: `node "UX UI/stories/exhaustive-regressions.cjs"` covers missing-context continuity, short/enlarged chrome clearance, checked-miss draft/focus, second-save focus and truthful readonly feedback. The preserved 1.7 exhaustive archive records that completed phase. Package the current revision with `node "UX UI/package-handoff.mjs"`; do not relabel a new revision with the older exhaustive phase.
