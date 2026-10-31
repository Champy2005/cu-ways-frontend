# US-026 — Proof of delivery

> Current handoff: [interactive HTML demo](demo/index.html), built from this story's canonical state inventory and decisions with shared theme 1.8.0. Representative screens were independently reviewed; see [the review record](../REVIEW.md). The original Figma/SVG export and older viewer remain unchanged under `design/` as read-only provenance. This local design review does not claim application implementation.

The archived local design (24 October 2026) contains **29 editable SVG screen masters, 14 canonical states, nine grouped chapters**, and an older interactive browser reference. Those exports preserve CU Ways shared theme 1.0.0 as historical provenance. The current HTML demo is the active design handoff and consumes shared theme 1.8.0. Application implementation is separate.

Figma import is deferred by the user's decision. The destination file already contains three pages, and Figma Starter blocked another page. All existing Figma pages were retained.

## Current live-prototype scope

On 25 October 2026, the **Try the flow** view in `design/index.html` was selectively updated to use the shared theme 1.3.0 `banner` and `feedbackBlock` recipes for list-load failure, rejected save, uncertain save, refreshed miss, changed job status and confirmed save feedback. Recovery actions render outside the banner using shared action/icon markup. The local mock save, retry, reconciliation, draft-retention, status and access transitions remain illustrative.

This update does not migrate the Flow board, the 29 archived SVG masters, or their 1.0.0 palette and action styling. It is not full US-026 theme adoption or application implementation. Figma/SVG assets remain untouched.

## Current HTML handoff

Run the current interactive demo using the instructions in [demo/README.md](demo/README.md). It exposes all 14 canonical story states, responsive and theme controls, long-link fixtures, keyboard-accessible form interactions, and simulated save/recovery outcomes. The simulation never calls the product API and does not prove authentication, authorization, concurrency, or persistence.

## Read-only source archive

From the CUWAY workspace, the archived board can still be inspected at:

```powershell
python -m http.server 8766 --bind 127.0.0.1 --directory "UX UI"
```

Open [the archived local viewer](http://127.0.0.1:8766/US-026/design/index.html). It has **Flow board**, **Screens**, and **Try the flow** views. Chapter navigation keeps the story understandable without fitting dozens of tiny screens into one viewport. The local preview server must be running; opening index.html directly does not support its fetch-based viewer. These source boards are not included in the portable handoff archive.

- [Complete SVG for later Figma paste](design/figma-paste-complete.svg): large editable canvas headings, grouped named chapters, named screens, and labeled arrows.
- [Design and integration handoff](HANDOFF.md): requirements, decisions, state behavior, and import instructions.
- [Screen inventory](design/manifest.json): dimensions, controls, transitions, provenance and limitations.
- [Structural verification](design/qa/structure.json) and [browser observations](design/qa/browser.json).

## Rebuild

```powershell
python "UX UI/US-026/build-design.py"
node "UX UI/US-026/render-preview.cjs"
```

The builder requires Pillow and reads the shared theme plus the existing US025 source artwork/fonts. It only writes inside this story's design directory. The optional renderer uses Sharp plus fontTools/uharfbuzz; the existing local font tools are under `.artifacts/ux-font-tools`. It shapes official Inter into disposable render inputs to prevent font substitution. The preview HTML is maintained in place and is not overwritten by the builder. Generated PNGs are visual references; SVG masters retain text and vectors.

Chp owns the three UX/UI tasks: upload section, URL/timestamp list and invalid attachment-type alert. Source: `Backlog (3).xlsx`, Project Backlog row 27 and Sprint Backlog III rows 28–38. This is a **proof-link submission** design; the story does not establish local binary file upload, file-extension restrictions, editing, deletion or job completion.

The live loading sample also uses the shared pending/info message. Its fixture-only “Finish loading sample” control lives in the author controls outside the product preview, not in the banner or product task flow. Focus uses the shared focus-visible recipe; no story-specific banner frame is painted for every pointer-triggered focus.
