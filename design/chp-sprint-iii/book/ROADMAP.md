# UI consistency tooling — implementation status

The user explicitly requested implementation in the current iteration. The initial future-only plan is superseded for the runnable HTML UX/UI app; application adoption remains separate.

## Implemented in 1.9

- TypeScript compiler symbol graph resolves imports, aliases, namespace members, re-exports, const aliases, wrappers and reverse potential routes. HTML inline modules, CSS/resource/token edges and discovered scoped HTML entrypoints are included.
- Agent CLI: ui:list / inspect / where / affected / build / check / validate. Aliases resolve visible words such as Accepted, Back to workspace and Stop waiting. Inspect includes source parameters, recipes, tokens, contracts and checks.
- Stale source/tool/contract/new-route checks; canonical lifecycle/action/back/close ownership checks; duplicate markup, reserved attribute and host paint guards. Native author-control exceptions are explicit and reasoned. Negative fixtures prove reproduced bypasses fail.
- Actual baseline/current source hashes and token/effect change reports; missing baseline files remain unclassified. Validation runs actual rendered shared-contract and action/lifecycle hierarchy matrices.
- Compiler-derived call sites feed the existing machine-first design index. JSON records retain guidance and actual component/parent/page evidence.

Read [CLI instructions](../tools/ui/README.md). Unknown computed imports/data/attributes remain visible. CSS inventory is conservative, not a full cascade solver. Static reach is potential scope, never proof every conditional renders. Image judgment and human palette acceptance remain separate.

## Remaining or separate work

- Frontend Next.js/TypeScript adoption, its own component/route graph, lint/type/CI integration and API verification require a separate repository task. No frontend/backend edits or new dependency installation were made.
- Selective screenshot scheduling may use this graph; the current exhaustive named-state matrix remains the stronger local check. Arbitrary runtime combinations remain unvisited.
- SQLite/MCP/fuzzy search/Storybook are optional future integrations only if measured need justifies them. Versioned JSON plus the CLI currently serves the requested searchable index efficiently. No database service, Nx, monorepo migration or vector service is required.
