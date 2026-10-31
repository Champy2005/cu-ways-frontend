# Independent iteration 1.9.0 rendered review

No remaining blocking visual defect was found in the inspected scope. This is a scoped independent model review, not human palette approval. Purple was explicitly rejected; the replacement supporting slate-blue and progress blue-teal remain awaiting human judgment.

Requirements were prepared before candidate renders in `requirements.md`. Selected Round 10 and current frontend references were opened. Implementation sources were read only; this reviewer changed only its own evidence/scripts/reports.

## Actual coverage

- All **94 named states** were captured in **both themes at 390×844 and 1440×900**: 376 rows, 1,724 normal captures. All 94 corrected-palette comparison sheets were actually opened. Each sheet shows initial mobile page, reduced desktop page and primary desktop component. This does not claim that all full-page/end pixels or every child detail were individually examined.
- 90 additional rows cover 320×568 with 200% text, 390×300 short screens and 2560×1347 large desktop. Selected native stress images were opened; the rest remain captured-only. Horizontal overflow was zero in these captured rows.
- Current-token follow-up captures cover 10 selected states across all five stories, both themes and sizes: 40 rows, 184 images. The current-token lab has 64 captures. Native crops and parent/page evidence were opened for actions, badges, Back, More options, proof workspace/dialog, completion requirements/dialog, cancellation dialog and review header.
- Corrected-palette live checks exercised 34 specified behaviors with 30 source-pinned captures: canonical Accepted paint equality in lab/025/027/028, transparent quiet hover, actual Stop waiting exits, pending-dialog Escape/reopen/background completion, and keyboard reachability on narrow/short dialogs. These functional observations are not blanket visual acceptance.
- Root theme toggle and US025 author C03 held-start controls were exercised. Enabled paint and actual enabled state agree, then both become disabled after Resolve. Current labels clearly distinguish held starts from held job reads.

`coverage.json` and `curation-inspection-ledger.json` give exact counts and actual opened/sheet-inspected/captured-only status. `book-evidence.json` contains importable captures with original hashes; `component-inventory.json` maps existing records and consumers. `import-shortlist.json` is a compact native-image shortlist for the existing records, not a new book. `curation-validation.json` checks missing files and duplicate IDs.

## Independent judgments

The replacement slate-blue support role is visible in both themes and remains subordinate to solid blue and pink commitment actions. Progress blue-teal is distinct from Accepted blue, Completed green and Cancelled neutral. Warning/success/error surfaces are distinguishable from utility button fills. The six roles have observable boundaries: functional supporting actions remain bounded, quiet acknowledgments remain transparent, safe outlined alternatives precede critical confirmation on mobile. Content More options has a discoverable boundary and a substantial hit area. No new fade behavior was introduced.

Wider My Jobs uses available desktop area; very-wide two-column cards preserve ID/title/status separation. Long content clamps with detail navigation. Normal page headings retain their expected composition across recovery cases. Narrow/short dialogs can scroll internally; real Tab navigation reveals complete focused critical actions. Large-text navigation flows into rows rather than obscuring final content. Content dialogs dim/blur backgrounds; reduced-transparency example uses dimming with no backdrop filter.

One proactive clarity finding was accepted and resolved: US027 B03 showed an Accepted entity with the unmet criterion phrased as an assertion that the job was In Progress. `In Progress status` / `Completed status` now names the required condition clearly. The corrected B03 sheet and current native task image were inspected.

The snapshot-only suggestion to remove initial safe-action focus was declined with evidence. Real pointer opening focuses the safe action without a focus-visible ring; keyboard Enter opening correctly shows that ring. Thus the URL-seeded ring is modality/focus evidence, not a permanent resting border. `focus-policy/A01-pointer.png` and `A01-keyboard.png` were individually opened. Those diagnostic files lack a dedicated source-hash manifest and are not rebound to current hashes; use the source-pinned live hover checks alongside them.

R13 author Resolve/Leave was an inapplicable probe, not a product defect: these controls resolve pending start requests, whereas R13 is a held read with its own Stop waiting. Root clarified labels/hint. The final C03 actual enabled→Resolve→disabled source-bound captures were inspected. The initial failed R13 files were overwritten by the C03 probe before preservation was requested; no retained R13-image claim is made.

## Provenance and limits

The full normal/stress/live matrices retain the exact `04b276…` theme source hash from before the final reserved-accent alias change. The final alias removes unused purple from the lab parameter picker; no recipe/story consumes that reserved token, independently checked by source search. Current follow-up captures use `add7b0…`; comparison results in the ledger preserve both files and their exact pixel differences. Originals were never relabeled or overwritten as final. Earlier purple captures and their ledger remain pre-correction; the first unstable diagnostic run is not acceptance evidence.

Some locator screenshots of tall parents auto-scroll under sticky chrome. Those are explicitly marked partial; the overlapped top does not establish actual component geometry. Initial page viewports were captured before locator scrolling. `clean-close` captures place the review-history heading below the sticky bar through actual scrolling, then clip without modifying styles. Both themes at 390/1440 were captured and selected native headers/page context opened.

Workbench manifests pin source hashes but did not record an end-of-run hash field; current-source equivalence is checked separately in the curation ledger. Other final capture manifests record stable before/after sources. API permissions, request concurrency, persistence and frontend application adoption remain outside this local HTML review. Human-unvisited states and pending human color acceptance must remain explicit in the main book.
