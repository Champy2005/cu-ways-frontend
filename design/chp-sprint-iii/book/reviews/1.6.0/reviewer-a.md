# Independent rendered review A — US025 / US026

Reviewer: fresh independent reviewer A. Implementation and book JSON were read-only. Review used actual Chromium renders and pointer/keyboard actions at `http://127.0.0.1:4187/`. This is local HTML design evidence; no application API, persistence or permission proof is claimed.

The inspected compositions meet the named guidance below after the scoped repairs. Human color judgment remains **awaiting review**. This is not blanket acceptance of the94 named story states.

## Finding and retake

**A1 — repaired: enlarged proof empty-state copy overflow.** At320×844,200% text in US026 B01, the horizontal empty-state composition retained an88px icon and32px gap, leaving108.27px for copy. The text ran to x297.28 while the card ended at x288. The document still reported no horizontal overflow, so that metric alone would miss the defect. The failed close and page evidence are `026-empty-overflow-dark-320-*`; geometry is in `interaction-geometry.json`.

Root added a narrow enlarged-text column fallback. Fresh A01/A02/B01 captures in both themes now place the copy in a182px column at x69…251 inside the x32…288 card, with48px artwork. Close images contain all copy and preserve inner padding. A real document-end scroll clears the entire empty state above navigation. Normal390px/1440px proof compositions were retaken and remain compact. See the `repaired` files and `repaired-geometry.json`.

**A2 — root-discovered edge case, repair independently verified: unavailable-card overflow.** Root’s earlier internal-overflow matrix reported US026 C03 at320×420/200% with a254px card client width and317px scroll width. That original failure was reported by root; this reviewer independently inspected the current repaired source and rendered result, without recreating an obsolete implementation. The original reported measurements are transcribed from the initial read-only tool output in `c03-root-prerepair-geometry.json`; the root’s later replacement matrix is retained separately in `c03-root-retest-geometry.json`.

Fresh close card, parent, full-document and keyboard-return captures were opened in both themes at320×420/200% and390×844/100%. At the short enlarged size,16px card padding leaves a222px child column; the complete36px two-line title and32px message remain inside it. Card client/scroll widths are254/254 and document width is320. At390px, the normal title is24px, card client/scroll widths are356/356, and document width is390. The sparse normal page keeps navigation at the viewport bottom; the short enlarged page puts navigation after content in flow. No title, message or return-link clipping was found in these inspected captures. The return target remains44px high at normal size and approximately89.59px at200%, shows its full keyboard focus outline, and its actual activation opens My Jobs. Evidence uses new `026-C03-unavailable-retake-*` filenames; exact boxes and return outcomes are in `c03-repaired-geometry.json`.

No other supported visual defect was found in the images actually inspected. This statement does not cover unvisited states, alternative browser-native pickers, touch hardware, or application integration.

## Reviewed decisions

- Job cards: adjacent job identity/status, title, explicit fact labels and aligned View job action; full-width mobile action. Viewed close crops and surrounding list context in both themes.
- Job overview: useful survey names, subordinate count, aligned metadata, contract status and agreed price; one quiet top-left return. Reviewed accepted and in-progress layouts at390/1440, with bounded large-display scale comparison at2560×1347 and3840×2160.
- Proof heading/workspace: readable title and job identity, status with heading, compact Add proof, one expanding form above saved proof, concise empty state. Reviewed no-proof, input, invalid URL, confirmed saved proof, long multi-row proof and unknown-save recovery compositions.
- Evidence links: full destination remains in the link/accessibility name; host/path are deliberately wrapped; external cue stays with the host; Proof tag is visually distinct from the link. Reviewed the long fixture at390/1440 and enlarged320px.
- Shared navigation/dropdowns: inactive desktop hover uses a rounded rectangle matching selection; mobile selection stays icon based. Native status picker has an inset arrow and rounded bounded panel. Actual keyboard Space→ArrowDown→Enter committed Accepted at390/1440 in both themes. Page return keyboard focus was inspected.
- Feedback/actions: paint and recovery controls are separate, with coherent error/warning/info/success hierarchy in the inspected states. Quiet Dark actions retain visible boundaries without a broad halo. Colors remain proposed pending human judgment.
- Dialogs: declarative titles, mobile gutters, bounded width, concise identity/price and clear action order. Real Start activation was reviewed at390×844,1440×900,320×844/200%, and390×300 in both themes. At short height the title and actions remain reachable by scrolling; outer focus is included in the padded close captures.
- Pending operations: actual Start dispatch can dismiss to a visible View progress affordance; proof save can close its form and navigate to My Jobs with the operation visible. The jobs entry has explicit identity/status/title/action spacing. Offline Start opens connection feedback. Timeout/result correctness is outside this visual review and belongs to root’s functional checks.
- Fallbacks: explicit reduced motion/transparency at390px in both themes kept the glass header opaque with no backdrop filter and removed Save hover movement. This is local Chromium evidence, not an assertion about every platform preference implementation.

## Scope and limits

Captured base states were US025 L02,D02,D04,R01,L06 and US026 A01,A02,B01,A06(long),B03,C01,C03 at390×844 and1440×900 in both themes. Additional live states included US025 C01/C03, offline R11, L07/R12 feedback, and US026 A03/background/jobs-entry/A04. Selected scale samples used2560×1347,3840×2160 and320×844 with200% text. These are capture/inspection samples; each manifest image distinguishes captured-only evidence from an actual image inspection.

Direct US025 `?scenario=C01`/C02 URLs intentionally normalize to D02. Early files with those requested names show D02; actual dialog review uses the `live` and `dialog-focus-bounds` captures after activating Start. The manifest records both URL and actual rendered state. The first ArrowDown/Enter-only picker attempt did not change the value; the `picker-keyboard-commit` files record the correct Space/ArrowDown/Enter interaction.

Not every screenshot in the diagnostic matrix was opened for image inspection. Unvisited scenarios and combinations remain unvisited. Captures alone are not independent acceptance. No approval is granted to other stories or to every consumer of a shared component.

References read: workspace AGENTS.md; WORKFLOW.md; book README/PRINCIPLES/CAPTURES; named component and page records; latest Round10 notes including the2px shared rim; existing current-frontend research and rendered Invitations/confirmation screenshots. Current explicit book/human direction overrides older reference details. Figma/SVG and application repositories were not edited.

The curated manifest is `UX UI/book/evidence/1.6.0/reviewer-a/capture-manifest.json`. It records source hashes, revision, theme, viewport, text scale, interaction context, URL and actual rendered state, plus component parent/page links. It contains180 curated PNG records:110 individual images were actually opened, and70 are captured context companions that were not separately opened. These image counts do not correspond to scenarios. The remaining566 diagnostic PNGs and complete diagnostic manifest remain under this reviewer’s `.artifacts` folder. Original failed evidence is preserved. The additional16 C03 records are all independently inspected; they add only the named unavailable-state scope and do not extend approval to unvisited states.
