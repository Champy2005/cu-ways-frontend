# CU Ways design book

[Open searchable book](index.html) · [Project principles](PRINCIPLES.md) · [Capture contract](CAPTURES.md) · [Catalog](catalog.json)

Start here before changing UX/UI. Search by the visible name, alias, story, state, source file or symptom. Repeated human comments are consolidated into the owning component record; annotation numbers are deliberately omitted.

For agent work, start with [INDEX.md](INDEX.md) or [component-index.json](component-index.json): one compact component/source/consumer lookup. JSON records are the small local database; the HTML viewer is optional. Regenerate with `node "UX UI/book/build-index.mjs"`; `--check` fails on stale mappings or record summaries. Run `node "UX UI/stories/consistency-check.cjs"` after shared changes to inspect the actual rendered contracts across all named states. A consumer map prevents missed scope; rendered and image checks catch inconsistent results. Neither replaces judgment.

The HTML app now has a compiler-derived [UI context CLI](../tools/ui/README.md): `ui:list`, `ui:inspect`, `ui:where`, `ui:affected`, `ui:build`, `ui:check` and `ui:validate`. Start there before global edits. It resolves symbols/aliases/wrappers and CSS/token impact; the generated index consumes that graph. Stale sources/new routes and demonstrated ownership bypasses fail checks. Dynamic usage remains explicit unknown scope. [ROADMAP.md](ROADMAP.md) separates this implemented scope from future frontend adoption.

The authoritative decisions and review status live in `records/*.json`. `catalog.json` is their searchable directory. The HTML viewer reads those same files. Edit the existing record instead of creating another competing specification. Global executable values remain in `../theme/theme.json`; records reference their token names and source files rather than maintaining a second palette.

Each record contains human guidance, implementation decisions, parameters, consumers, source links, review status, evidence and history. Page records additionally track individual scenarios. A shared fix can be inherited by another story without implying that its whole page was visited or accepted by the human.

Keep four things separate:

- **Human feedback:** supplied observations or explicit decisions. The first batch covers US025/026/027 and selected shared/pagination details in US034. The latest batch adds named US028 A01 components and US034 A01/A04/B02 review/disclosure/filter/rating feedback. Some screenshots show earlier revisions.
- **Implementation:** planned, changed, or verified behavior.
- **Rendered inspection:** unvisited, needs retake, inspected by owner, or independently inspected, always with its actual theme/viewport/state scope.
- **Human judgment:** awaiting review, accepted in a named scope, or revision requested. A model or passing test cannot grant human color approval.

The marked screenshots supplied in chat are reference evidence; their original files are not available as named workspace assets. New captures in this book identify the actual current source, state and viewport, so they must not be described as the exact earlier screenshot. Preserve earlier evidence when replacing a current capture.

Use `node "UX UI/book/validate.mjs"` to check the records and evidence links. Follow [the workflow](../WORKFLOW.md) for each change. The portable handoff includes the book and its curated captures; large diagnostic runs can remain under `.artifacts/work/` with a link from the relevant record.

The current design revision is 1.9.1. Purple was rejected by the human; replacement colors still await human judgment. A record’s `evidenceRevision` identifies its latest scoped capture set. Captured-only, contact-sheet and individual-image inspection remain distinct. Read [latest judgment](reviews/1.9.1/root-judgment.md) and [research](research/2026-10-31-action-colors-and-enforcement.md). Earlier scoped judgments remain preserved.

[Completed exhaustive design review](reviews/exhaustive/root-judgment.md) covers all 94 named states and the 32 modular book records beyond the earlier sealed 1.7 handoff. It does not change human-unvisited or pending color judgment.
