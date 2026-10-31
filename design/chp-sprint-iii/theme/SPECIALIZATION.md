# Theme inheritance and specialization

New pages and story demonstrations inherit the CU Ways Rose × Slate 1.5.0 feedback revision. Every adopting composition still needs its own rendered review. The selected Round 10 appearance remains a comparison input, with explicit later user corrections taking precedence. The order is:

**Shared parameters → Light/Dark semantic values → shared component recipes → story/feature aliases → page/instance choice.**

A story normally selects an existing semantic role and composes the shared header/menu/navigation and other shared components around its own requirements and content. Its own record continues to own behavior, copy, route, permissions, status vocabulary and content-driven layout. Shared component measurements are not page coordinates; local demo dimensions are not global parameters.

## Decision record and explicit host binding

[specialization.example.json](specialization.example.json) is a decision-record template. Set its `extends` version to the canonical theme version being specialized. The record identifies the affected scope, owner and reason; it may declare local aliases under `layout.*`, `component.*` or `semantic.*`.

The record is not an automatic theme loader. `validateSpecialization` checks record fields and alias boundaries, but it does not connect an alias to a browser element or apply values at runtime. The host must explicitly map each approved alias in its own component or scoped stylesheet. For example, a story can declare `layout.resultsGap`, then deliberately use `var(--story-results-gap)` in its own root-scoped CSS. Merely adding the record changes no preview, application or generated theme file.

A specialization describes an exception to inherited behavior; it does not clone the shared theme or authorize replacing a brand/foundation token. For a component exception, name the inherited token or recipe and bind the local alias only on the named component variant. For a content layout, use intrinsic and relative sizing where practical. A page with different alignment, density or column count does not need a theme exception simply because it differs from the reference composition.

```json
{
  "id": "US-025/job-summary-card",
  "scope": "US-025 / job-summary card",
  "owner": "Story implementation owner",
  "reason": "A validated status summary needs a different local spacing rule.",
  "extends": { "source": "../../theme/theme.json", "version": "1.5.0" },
  "overrides": {
    "layout.summaryGap": {
      "value": "1.25em",
      "reason": "Fit the story's actual summary content while preserving text scaling."
    }
  },
  "validation": { "status": "pending", "publish": false, "evidence": [] },
  "reviewAfter": "Review during implementation; promote only if multiple consumers benefit."
}
```

Keep the record in the owning story or feature. When implementing it, define and consume the alias within that named scope, rather than adding global selectors, `!important` rules or selectors that defeat inheritance. If the exception proves useful for several consumers, propose promoting it as a versioned shared decision and remove duplicate local aliases after promotion.

## Review before using a local exception

Record the affected component/story, owner, reason, inherited token or rule, proposed alias and value, and why the inherited rule does not fit. Validate the actual Light and Dark results, surrounding contrast, text enlargement/zoom, keyboard focus, and pointer/hover behavior in the host composition. Then ask a fresh, unbiased reviewer to inspect the rendered result against accepted requirements and source references. The root evaluates each finding and rejects an inaccurate finding only with direct evidence. Keep the record pending until those checks have evidence. Green functional checks alone do not approve visual fidelity; a record's validation status does not replace application or accessibility verification.

Brand/logo changes, shared status meaning, theme preference behavior, removal of focus/accessibility behavior, or changes to a shared component recipe require a shared theme decision. Do not treat a local alias as approval for any of those shared changes.


## Sprint III task compositions · 1.5.0

The owner is the local UX/UI handoff. Scope: the five Chp Sprint III demos and their local entry library. These compositions extend the generated global tokens and shared action, status, navigation and feedback recipes; they introduce no private palette.

- **Job list fact columns** — US-025 owns stable Creator, Agreed price and Deadline columns, a separate survey title, and its list entry action. Columns collapse intrinsically at narrow/enlarged sizes.
- **Proof entry and saved list** — US-026 owns one helper per URL field, an input well using the shared control roles, and a compact saved-list empty state.
- **Job task summary** — US-027/028 use `jobSummary` from `stories/runtime.mjs` for job identity, lifecycle and agreed context. Requirements or cancellation consequences follow it directly; the summary replaces the duplicated tall fact panel.
- **Review record rhythm** — US-034 owns the profile row, rating distribution, neutral verification caption and compact pagination. The verification icon still uses the shared success signal; rating paint is shared. At narrow enlarged text the profile row stacks.
- **Overflowing dialog opening** — shared story dialogs open at their title when content exceeds the viewport; normal-size dialogs start with dismissal focused. Native focus containment and trigger restoration remain required.

Validation: current rendered scope and independent judgments are in `../REVIEW.md`; source and screenshot evidence is under `.artifacts/work/uxui-iteration2-20261029/`. These are intrinsic content layouts, not fixed screen coordinates. Future stories should reuse the shared system and record a justified specialization before copying a story composition.
