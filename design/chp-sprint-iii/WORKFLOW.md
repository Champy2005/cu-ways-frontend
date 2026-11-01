# Working with the handoff

Read [the principles](book/PRINCIPLES.md), the owning [decision record](book/README.md), story requirements and scenario model before editing. Current explicit user decisions take priority. Selected Round 10 appearance and inspected frontend remain comparison inputs, corrected by later user decisions. Their captures stay in the original workspace; this export omits them. Keep Figma/SVG source references read-only unless edits are expressly authorized.

## Source ownership

- theme/theme.json owns promoted shared values and Light/Dark roles. Regenerate its projections with `node theme/build.mjs`.
- theme/components.mjs and theme/recipes.css own shared markup, recipes and accessibility fallbacks. See [COMPONENTS.md](theme/COMPONENTS.md), [PARAMETERS.md](theme/PARAMETERS.md) and [SPECIALIZATION.md](theme/SPECIALIZATION.md).
- US-*/model/scenarios.json owns canonical state inventories. Regenerate with the US025/US026 demo builders and stories/build.mjs for US027/US028/US034.
- US-*/demo/ owns story behavior, copy and intrinsic composition. The latter three stories also use the shared stories/ runtime and studio.
- book/records/ keeps compact human guidance and decisions. Capture ledgers/history are excluded; absence of evidence does not mean approval.

Specializations need a named reason and an explicit host binding. Do not clone the palette or copy screenshot coordinates into global layout rules. Workbench drafts live in browser storage; exporting one does not promote it to theme.json.

## Review and boundaries

Use [EXPORT.md](EXPORT.md) to run/check/package. For material visual edits, use the full workspace workflow: inspect component, parent/siblings and page in both themes, relevant responsive/text sizes, keyboard and reduced motion/transparency states. Update the same record with exact sources, parameters and actual coverage. Obtain fresh independent rendered review against user decisions and selected references before claiming visual acceptance. Keep unvisited scope and pending human color judgment explicit. Keep new capture matrices and diagnostics outside the export.

Loading stays escapable. Before dispatch, dismissing a draft may cancel it. After dispatch, dismissal preserves the operation, duplicate-write guard and visible progress/recovery path; it cannot promise rollback. Reconcile uncertainty through an authoritative read before another mutation.

These fictional demos make no product API calls. Mock outcomes and browser storage do not establish permissions, concurrency or durable persistence. Inspect current frontend/backend contracts for a separate adoption task; archived integration proposals are not agreed endpoints.
