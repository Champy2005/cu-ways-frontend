# Independent review — US025 / US026 — iteration1.8.0

No unresolved supported finding remains in the reviewed scope. Two focus defects were reported independently, accepted by the implementer, and verified after repair. Human palette acceptance remains pending.

## Rendered review coverage

- Original candidate: all41 US025 and14 US026 named states, Light/Dark,390×844 and1440×900, inspected on106 contact sheets including separate component families and selected320×568/200%,390×300 and page-end views. Long fullpage list sheets establish composition, not native-size reading of every repeated row.
- Post-repair retake1: all14 US026 states in both themes at390/1440, their unique component families at390, three US025 start-dialog variants, selected narrow/short sheets, and individual component/parent/viewport images.28 retake sheets were actually opened. Unopened generated retakes remain captured only.
- Current live flows:176 checks and112 captures; keyboard/boundary/fallback flows48 checks and78 captures. Both runs had zero errors and stable source hashes. Actual visible X/input, large page/parent, reduced-transparency and layout-menu screenshots were opened individually; exact rows inbook-evidence.json.
- Final copy-only B04 retake:6 combinations across Light/Dark320×568/200%,390×844 and1440×900. All6 visible-dialog component captures individually inspected, plus narrow Tab-input pages in both themes and selected parent/page context.30 checks,24 captures, zero errors, stable final hashes.
- All registered evidence is source-pinned. The ledger distinguishes34 individually opened images,632 sheet-inspected images and505 captured-only linked supports. Captured-only supports are not visual acceptance.134 portable inspection sheets are linked explicitly.

## Findings and dispositions

1. **US026 pending title focus:** A03 originally showed a UA outline tightly around “Saving proof.” Shared content-dialog title focus now appears as a panel ring; controls retain keyboard focus outlines. Verified in post-repair normal/short/narrow render and actual X keyboard focus.
2. **US026 checked-miss hidden initial focus:** B04 at320×568/200% initially focused the retained URL below the visible dialog. Overflow now opens at the visible title, while normal layouts focus the input. Native Tab scrolls X/input/Save into view; Escape remains available. Verified with actual keyboard movement, geometry and viewport images. Final shorter “Link not saved” feedback preserves the outcome without the obvious retry sentence; all6 final combinations retaken.
3. **Bounded long proof URLs:** Optional latest-guidance extension accepted. Shared path preview now has a two-line ellipsis; full href/title/accessible destination remain intact. Opened normal/narrow/large proof layouts and checked destination attributes.

No source/UI edit was made by this reviewer.

## Decisions supported by the review

- Proof entry is a separate top-layer modal with dim/blur, borderless-at-rest X and no movement of the saved-list coordinates. Draft retention, invalid URL/no-dispatch, focus return, Tab containment, pending dismissal/reopening and background completion were exercised in both themes390/1440.
- Unknown save outcomes require a read before retry; found/missing, explicit retry, rejected type, completed job and revoked access paths were exercised. No extra submit was implied by closing a dispatched operation.
- My Jobs h1 coordinates match normal/recovery/initial-loading states intrinsically at both checked widths. List titles are bounded; detail exposes their complete Unicode survey names.
- Unavailable patterns retain their left content anchors. US025 has a separate Job details page title and unavailable h2 card; US026 unavailable uses a compact internal h1. Their semantic distinction justifies specialization; forcing identical dimensions would not improve consistency.
- Current role surfaces distinguish success/error/warning/info from blue recovery actions and pink commitment actions. These are reasonable candidates with restrained saturation and legible hierarchy in inspected renders, not human-approved colors.
- Normal large headers remain sticky. Short/enlarged layouts use the intentional flow fallback; loading escape remains reachable. Reduced-transparency uses opaque dimming with no blur; attached layout menu remains unblurred.

## Artifacts and limits

`coverage.json` records named state coverage, checks, source hashes and exclusions. `component-inventory.json` maps component families/selectors/consumers/source to decisions. `book-evidence.json` is the complete normalized actual-inspection ledger; `import-shortlist.json` is an optional64-row concise book import containing current individually opened images and their exact context supports. `curated-manifest.json` mirrors the full ledger.

Original broad evidence predates the shared focus/URL repairs. Retake1/live/boundary evidence predates only the final B04 copy change. These batches keep their original hashes; final-b04 alone binds the final US026 screen source. Non-B04 code/palette did not change after retake1. Some overflowing locator screenshots omit outer focus/child content: those are not used as complete focus proof; actual viewport and keyboard geometry evidence provide that proof.

Local Chromium fixtures do not prove production API permissions, persistence or concurrency. Native device/screen-reader behavior was not audited. Unopened generated images and untested combinations remain unvisited. Final human judgment of colors is still required.
