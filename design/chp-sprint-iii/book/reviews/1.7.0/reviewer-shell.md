# Independent shell review · revision 1.7.0

Two supported defects were reported, accepted by the root, repaired, and independently retaken. No unresolved finding remains in this review's inspected scope. This is a scoped component and page review, not visual approval of all 94 story states or human approval of colors.

## Findings and repair evidence

1. **US025 enlarged status wrapped to the left.** At 320×568/200% in both themes, obsolete story CSS kept `.job-card-heading` in flex layout. In Progress wrapped below Job #61 with a 19.44px right gap; Accepted had a 40.66px gap. This contradicted the upper-right rule. Original evidence is retained as `025-L02-{light,dark}-320-200-long-component.png`. The root removed the obsolete enlarged heading overrides. Fresh `025-L02-{light,dark}-{320,390}-200-final-component.png` images were opened individually: the heading is now a grid, the badge occupies its own right-aligned row, and the identity retains its complete measure. `final-diagnostics.json` records stable before/after hashes and zero right gap.

2. **Actual keyboard focus was hidden by the enlarged bottom navigation.** At 320/390×568/200%, Tab from the native Status select focused the first View job link at approximately y334–426 while navigation began at y312. Enter still navigated, and manual scrolling revealed the same focused link; this was a keyboard-clearance defect rather than a navigation trap. The opened `025-keyboard-light-320-200-page.png`, `025-keyboard-dark-390-200-page.png`, and manual-scroll comparison retain the failure. The root replaced inherited `scrollIntoView` centering with a measured window scroll. Fresh actual-Tab retakes in both themes and both widths show the entire focus outline above navigation. Target clearance is 7.55–8.14px; Enter opens Job #61/D04 in all four cases. Ordinary 390×844/100% list focus remains visible. US026 Tab reaches Add proof, and Enter focuses Delivery link. See `focus-final-diagnostics.json` and `025-focus-final-*` / `026-focus-final-*` evidence.

Tall locator screenshots sometimes include a fixed navigation bar over content outside the visible band. Those images alone were not treated as UI defects. One initial US025 enlarged parent crop captured mostly navigation and is explicitly marked unusable for parent composition judgment. Its original bytes remain retained.

## Inspected result

- The lifecycle/status headings inspected in US025 cards and Contract, US026 proof heading and My Jobs entry, and US027/028 summaries use a consistent right edge. Pending uses a clock; checklist cues and attachment types keep their separate roles.
- No-active-jobs, no-hired-jobs, and no-status-match headings put the board icon beside the text. Normal Light/Dark mobile/desktop empty cards are compact and keep their relevant action. The no-match reset copy remains visible.
- Individually opened Light/Dark native picker crops at 390 and 1440 show the faint option separators within the existing rounded panel, along with selection and inset arrow. Actual Space → ArrowDown → Enter commits Active → Accepted; reopening and Escape preserves Accepted and closes the picker in all four cases. A forced `appearance:auto` Light/390 fallback renders the native platform menu and still commits selection. Other browser-native picker appearances were not inspected.
- Live confirmation and held pending states were exercised. The pending presentation exposes Continue browsing and Close; Escape dismissed it while the recorded operation remained `start`, preserving the distinction between UI dismissal and a dispatched operation. The enlarged confirmation can scroll and remains dismissible.
- Long Unicode/Thai summary titles reflow in US027/028 at 320/200%. US026 also received a clearly labelled, DOM-only long-title stress case; its fixture otherwise lengthens URLs rather than the job title. These are layout fixtures, not new product statuses or copy.

## Actual coverage and references

The browser ran the product `screen.html` URLs directly at `http://127.0.0.1:4187`. The author studio was not substituted for the product screen. Both themes were captured at 390×844 and 1440×900 for US025 L02/L03/L04/L05/Contract, US026 A01 and the live My Jobs entry, and US027/028 A01 summaries. Opened component, parent/sibling and page images cover those patterns; the manifest states the exact image-level inspection scope. Representative 2560×1347 and 3840×2160 images, 320px/200% text, long content, short heights, keyboard operation and native fallback were also inspected. Captured-only companions remain labelled captured-only.

Read inputs included the workspace AGENTS, workflow, book README/principles/capture contract, layout-and-review research, status-placement/empty-state/dropdown/job-card/proof-header/jobs-entry records, selected Round 10 notes, and current frontend research. Opened comparison images include Round 10 list/tray views and current frontend desktop overview/confirmation plus mobile invitations/confirmation. Later human placement and minimal-copy decisions were applied ahead of differences in those references. The supplied mobile-invitations reference has its recorded scaling/cropping limitation and was not used as a sizing prescription.

## Evidence handoff

- `curated-manifest.json` is the book-import manifest. It contains **94 individually opened images** and **121 captured-only companions**, each with actual state, URL, viewport/theme/text scale, source hashes and parent/page links. The number 94 here is an image count, not state coverage.
- The same curated manifest is at `UX UI/book/evidence/1.7.0/reviewer-shell/capture-manifest.json`.
- `capture-manifest.all.json` retains all 286 original capture records for diagnostics. The 71 unselected captured-only images were moved, after retakes finished, to `captured-only/`; `diagnostic-move-receipt.json` preserves original paths and SHA-256 identities. Original failure images remain in the curated book evidence.
- `opened-images.json` is the explicit opened-image ledger. `diagnostics.json`, `followup-diagnostics.json`, `final-diagnostics.json`, `focus-diagnostics.json` and `focus-final-diagnostics.json` retain interaction and geometry details.

Human color judgment remains pending. Firefox/Safari/native-device behavior, screen-reader output, every responsive/state combination, application integration, API permissions/concurrency and durable persistence remain unproven by this local design review. No UI sources, design-book records, application repositories, Figma or SVG were edited by this reviewer.
