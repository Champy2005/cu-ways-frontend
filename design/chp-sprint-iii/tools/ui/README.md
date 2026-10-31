# UI context and consistency CLI

Scope: the runnable HTML UX/UI app, five assigned stories, entry/author shells,
component lab and palette utility. Application frontend/backend adoption remains
separate. This is a source-derived JSON index, not a second visual specification.
The CLI exposes eight canonical atom contracts. The existing32 topic/page records
cover intrinsic layouts and guidance; find those through `book/INDEX.md`. A
registered shared atom and a record-owned page composition are different scopes.

From CUWAY:

```powershell
node "UX UI/tools/ui/cli.cjs" ui:list
node "UX UI/tools/ui/cli.cjs" ui:inspect Accepted
node "UX UI/tools/ui/cli.cjs" ui:where Action
node "UX UI/tools/ui/cli.cjs" ui:affected Action
node "UX UI/tools/ui/cli.cjs" ui:build
node "UX UI/tools/ui/cli.cjs" ui:check
node "UX UI/tools/ui/cli.cjs" ui:validate Action .artifacts/ui-impact.json --baseline .artifacts/preserved-ui-source
node --test "UX UI/tools/ui/engine.test.cjs"
node "UX UI/book/build-index.mjs"
node "UX UI/book/validate.mjs"
```

Before a shared edit, inspect the owner/parameters/recipes/tokens and affected
routes. Preserve the affected source files in a directory with the same relative
paths before editing. Build after edits; stale source, guard contracts or added
routes fail `ui:check`. A baseline comparison reports actual hashes and changed
token/effect values; files absent from a partial baseline remain unclassified.
`ui:validate` first rejects static violations, then runs the rendered consistency
and hierarchy matrices against the local preview (default port4187; override
`CUWAYS_STORY_ORIGIN`). Set `CUWAYS_CONSISTENCY_OUTPUT` and
`CUWAYS_HIERARCHY_OUTPUT` to preserve each run separately.

`contracts.json` owns canonical exports/aliases, rules and reasoned exceptions.
Generic lifecycle repainting, duplicate atom markup, host paint overrides,
reserved attribute injection and raw product buttons fail the static boundary.
Author tools have explicit native-control exceptions, not permission to clone
canonical components. Lifecycle meaning lives in `lifecycleDefinitions`; action
appearance uses six explicit variants. Record-only intrinsic layouts remain in
the searchable design records.

The compiler resolves imports, aliases, namespace members, re-exports and
function calls/wrappers. Reverse file closure includes CSS/token dependencies;
those routes are **potential** scope. Dynamic data/attributes/import expressions
remain explicit unknowns. CSS inventory is a conservative flat declaration
scanner, not a full cascade parser. Arbitrary computed HTML, object spreads,
runtime plugin code and every possible interaction cannot be statically proven.
Runtime checks and component/parent/page image inspection are mandatory; passing
checks never grant human palette acceptance.

Read/query/hash checks in the portable bundle need Node only. Graph refresh uses
TypeScript5.9.3: the workspace reuses the existing frontend dependency read-only,
or install the declared private `tools/ui/package.json` dependencies in an
extracted handoff. Rendered checks use the workspace Playwright dependency and
browser; they are not represented as dependency-free portable tests. No install
or application repository change was performed for this tool.
