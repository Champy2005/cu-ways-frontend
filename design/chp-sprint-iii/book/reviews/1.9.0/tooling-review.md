# Independent UI consistency tooling review

Status: final route-coverage reporting retake passed 32/32 independent assertions with no source drift. No supported tooling implementation defect remains open in this inspected scope. Product color/layout acceptance is separate.

This review inspected the runnable HTML app's AST graph and CLI under `UX UI/tools/ui`. It did not modify the implementation, product UI, frontend or backend. All mutations were confined to uniquely named owned fixtures beneath this review directory. This report is separate from the independent rendered visual review.

## Evidence and method

Run `node .artifacts/work/iteration5-20261031/tooling-review/run-review.cjs` from the workspace root. The runner executes eight independent fixture probes and records source hashes before and after all 32 assertions. The final run passed 32/32 with no source drift. See `audit-summary.json`, individual probe JSON, and the corresponding CJS logs. Initial failures were retained in `*-initial.json` and `initial-findings.md`.

Final SHA-256 source binding:

| Source | SHA-256 |
|---|---|
| engine.cjs | `06396abc501eda1c9b11ee942270a15947b0a63b1825eed086e61123fdfa7e7c` |
| cli.cjs | `e915310a7aed13d4602749dbb6b4799f882687c6b115bc26a80c50b9b096ff86` |
| contracts.json | `32701109d36bb59c33bccc26c7106b945a46d55d1d4e06cedd1f7da43eac9684` |
| changes.cjs | `6082c4afafebe5e2858d60c46a03eff985c155a477e02f26ccc0a6a855d06105` |

The CLI probe deliberately substitutes successful local runtime stubs only inside its owned fixture, to isolate whether static contract violations can be bypassed. It does not establish that the application's actual browser checks pass.

## Repaired findings verified independently

- Imported aliases, re-export aliases, constant aliases, wrapper callers and inline namespace calls resolve to the canonical export and retain transitive callers.
- Local linked pages are traversed; new entry HTML, contracts and tool implementation changes invalidate a cached graph.
- Constant lifecycle labels cannot bypass the canonical badge renderer. Mutable label variables are not incorrectly treated as immutable constants.
- Attribute-based paint selectors, border shorthands and canonical fill-variable overrides are detected outside the shared recipe owner.
- Malformed executable source is an explicit violation; nonexecutable JSON metadata is not misparsed as JavaScript.
- Literal HTML and JS template canonical clones are rejected, including whitespace around a template's class attribute assignment. Native authoring controls require an explicit reasoned boundary.
- Exact reasoned CSS exceptions are recorded; an empty exception reason is rejected.
- `validate` refuses cached static violations even if its runtime checks would otherwise exit successfully.
- Computed dynamic imports remain explicit unknowns rather than being claimed as complete dependencies.
- Whitespace in a reserved `style =` attribute cannot evade ownership checks. Runtime attribute expressions are retained as explicit unknowns.
- Preserved baseline comparisons report actual file hashes, removal and changed token/effect values. Files absent from a partial baseline remain explicitly unclassified, without being falsely labelled additions.
- The real lifecycle contract exactly covers all eight canonical lifecycle definition keys, including `Status unavailable`; a generic badge call using that fallback label is rejected.
- Raw product button markup in a newly imported helper module is rejected regardless of filename or local CSS class. An exact reasoned native JavaScript author-tool boundary remains supported.
- Route coverage derives from actual parsed runtime receipts. Passed, failed, mixed and interrupted runs receive distinct conservative statuses; a new route or malformed receipt does not silently become visited/passed. Duplicate route inputs are deduplicated and every result retains the separate image-review limitation.

## Final integration observations

The final real cached `ui:check` returned success with no stale files or violations. Five runtime/unresolved dependencies remain explicitly listed: book runtime data fetch, story studio's unresolved local fetch and three runtime component-attribute expressions. Unknowns are visible analysis limits; success does not classify them as proven safe.

The book index compiler was inspected and now obtains shared API calls from resolved graph symbols and shared consumer scope from graph impact. Named intrinsic page subsets remain explicit. Its read-only `--check` correctly failed because generated `component-index.json` was stale while the parent continued updating the records/palette. Regenerate graph and book index once final runtime/record changes settle. The parent was notified; this is an integration refresh requirement, not a parser defect.

The earlier obsolete future-only/textual graph description in book README was corrected by the implementer. It now distinguishes the implemented HTML context CLI from future frontend adoption. This reviewer did not modify product documentation.

The final route-receipt diff was inspected in `consistency-check.cjs` and `hierarchy-check.cjs`: story routes are recorded from `page.url()` after the DOM read, rather than from their intended job list. The CLI adds receipt-derived coverage for the union of potential code/style routes. A successful receipt remains route-level contract evidence, not proof of every dynamic combination or aesthetic acceptance. The parent is running the actual final validator; the fixture retake independently verifies the reporting transformation.

## Interpretation and limits

The graph gives potential code and shared-style impact. It does not prove that a conditional branch renders, that all runtime configuration is resolved, or that a route is visually acceptable. CSS rules and token references are a conservative inventory, not a complete selector/cascade solver. Runtime layout, hover, focus, keyboard and image review remain necessary.

Graph refresh uses the installed TypeScript Compiler API (fallback to the existing frontend dependency); cached list/inspect/where/affected and hash checks require Node but do not need to load the parser. No package installation was performed by this reviewer.

The optional before/current report was independently exercised with changed, unchanged, deleted and current-only fixture files, plus shared/light/dark token scopes. It compares only preserved files, not an inferred complete Git history. The rendered hierarchy gate's implementation and product image judgment are outside this static-fixture review; the parent and separate rendered reviewer own that evidence. Baseline-free reports remain current potential-impact snapshots.

No remaining defect should be inferred absent solely because the 32 fixtures pass. The suite specifically covers the repeated ownership, alias, cache and guard weaknesses described above and complements the application's own tests and fresh rendered review.
