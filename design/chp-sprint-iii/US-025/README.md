# US-025 — Start an accepted job

**Current handoff: runnable HTML · 1.8.0 design revision · no application implementation.**

Open the [complete story demo](demo/index.html), [shared component/tuning workbench](../theme/lab.html), or [workspace entry](../index.html). The demo covers 41 canonical states from `model/scenarios.json`, with theme/viewport/text controls, ordinary clickable flows and deterministic mock outcomes. Its source is documented in [demo/README.md](demo/README.md).

All reusable appearance and microdetail target [theme 1.8.0](../theme/README.md), [component API](../theme/COMPONENTS.md), [parameter guide](../theme/PARAMETERS.md) and [specialization contract](../theme/SPECIALIZATION.md). The selected Round 10 appearance and inspected marketer frontend are comparison inputs; later user corrections take precedence. Use one return action per route/state: a normal detail view has one raw text Back link at the top, with no second Back inside its card. Card-context navigation is allowed only when no equivalent page link exists. The Contract panel groups lifecycle status, agreed price and actions without repeating the visible status in a heading or paragraph. Read the [design book](../book/index.html) for current component decisions and scoped captures. The mobile floating tray contains only Start. The shared header/menu/bottom-navigation recipes are used by the lab and story. The upper header has no rim; the lower 2px highlight/1px seam remains. The shared refresh and smooth busy spinner are real SVG/CSS components. See the [current feedback review status, coverage and limits](../REVIEW.md). Future material changes require fresh review.

Figma/SVG remain read-only unless explicitly requested again. Keep the selected Round 10 appearance available for visual comparison; do not dismiss it as historical. The [v3 SVG/Figma atlas](theme-v3/README.md), [v2 export](svg-handoff/README.md) and earlier examples provide additional reference context but do not override the latest user corrections. The current application remains a separate adoption task; use [the workflow](../WORKFLOW.md) for ongoing design and handoff.

The hired Survey Marketer explicitly starts a job: **Accepted → In Progress**. Accepting an invitation, hiring a marketer and starting work are three different actions.

The user also authorized a minimal **My Jobs** list and job detail/start flow. Chp's original three tasks remain the core: Start Job button/confirmation, status badges, unauthorized-start alert (Sprint Backlog III rows 16–18, 1.5 estimated hours). The entry list is additional enabling scope, not silently included in that original estimate.

## Read in this order

1. [Requirements and boundaries](01-requirements.md)
2. [Every interaction branch and state](02-flows-and-states.md)
3. [Desktop, mobile and intermediate layouts](03-responsive-layouts.md)
4. [Components, tokens and exact copy](04-components-and-copy.md)
5. [Frontend/backend handoff and proposed contract](05-integration-handoff.md)
6. [Acceptance and HTML scenario coverage](06-acceptance-and-frames.md)
7. [Decisions, readiness and proof limits](07-decisions-and-readiness.md)
8. [Research evidence](sources/research.md)

[Open the current playable story demo](demo/index.html). It is a local design aid with fictional data and scenario controls. It never calls an application API, persists a job or changes Figma. The written specification is authoritative where the study simplifies behavior.

## Readiness

See the [current feedback status and retained baseline evidence](../REVIEW.md). Keep the selected Round 10 appearance available for visual comparison, with later user corrections taking precedence. Figma/SVG remain read-only unless explicitly authorized. Product implementation still depends on a hired-marketer job read contract and a start operation; neither exists today. Their proposed paths, fields and failure semantics are explicitly documented, not presented as existing API behavior. The stale backlog transition/trigger wording must be reconciled by the story owner before coding those business rules.

Figma source: [SE UX UI — Page 1](https://www.figma.com/design/XMwuViKKwBvZFBqsVP6PAx/SE-UX-UI?node-id=0-1). Live inspection confirmed the blank Sprint III section, Inter job designs, Auto Layout patterns, zero local variable collections and zero local text styles. Existing job badges/dialogs are frames, not a published reusable component library.
