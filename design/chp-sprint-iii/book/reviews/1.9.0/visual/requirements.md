# Independent review requirements · 1.9 iteration

Prepared before candidate rendered inspection from the latest human comments, workspace instructions, design-book principles/records, selected Round10 direction and inspected frontend reference. Source/UI remains read-only for this reviewer. Current human corrections override older Round10 details; the reference remains a comparison input.

## Required result

- One recognizable lifecycle badge per status across the workbench and all five assigned stories: same icon, tone, type, padding, geometry and semantic label. In particular compare Accepted across the workbench, My Jobs, completion B03 and cancellation A02. Preserve upper-right entity placement and enlarged-text fallback. Proof attachment tags, verification labels and checklist symbols have different roles and must not be mistaken for lifecycle badges.
- Distinguish high-priority commitments, safe alternatives, useful functional navigation/recovery, quiet dismissal/back navigation and compact tools by appropriate hierarchy. Do not put useful View activity / View proof / Stop waiting at the lowest invisible-looking tier merely because they are secondary actions.
- Borderless content text controls must not produce a full filled button box on hover. Quiet text/underline/color emphasis may communicate interaction; keyboard focus remains visible. Layout-origin controls may retain their own bounded hover treatment. Do not add fade animations in this iteration.
- Keep In Progress and Keep job need visible, non-hollow alternative-action treatment. On a narrow confirmation dialog, critical Confirm remains at the bottom, with the meaningful safe alternative before it. Preserve an escapable pending presentation and operation semantics after dispatch.
- Functional Add delivery proof needs a legible color/weight against the modal, distinct from quiet Got it. Research informs candidate colors but human palette acceptance remains pending.
- Stop waiting needs discoverable emphasis in the initially loaded scaffold, with a real control that exits waiting. Do not block navigation or invent cancellation of dispatched work.
- The lab's page-return sample must use the same page-level Back to workspace component as real page returns, not a competing card action. Preserve meaningful context variants only when semantically justified and named explicitly.
- Content More options must have an adequately visible glyph and a discoverable bounded hit area appropriate to a text card; no tiny isolated dots whose apparent box only materializes on hover. Keep its keyboard label, focus and open-menu semantics. Do not hide functionality until hover on touch/keyboard.
- Desktop content should use appropriate available space and retain fluid readable alignment. Compare loaded/loading/recovery heading origins; inspect at1440 and the user's2560 viewport rather than prescribing screenshot coordinates. Mobile/enlarged/short fallbacks must remain sound.
- Proactively inspect related/sibling patterns beyond the supplied annotations: competing borders, hover/focus jumps, action order, status variations, content overflow, modal gutters, pending/retry states and unsupported navigation.

## Evidence and checks

Review actual candidate images in both themes. Capture changed component children, parent/siblings and whole-page context separately. Normal cases: workbench action/status/back/tool sections, color comparison and all affected story states at390/1440. Stress cases:320×568/200%,390×300,2560×1347, real Tab focus, hover, open menus, dialog dismissal/reopen and reduced motion/transparency where relevant. Verify actual rendered state, since US025 unsafe URL snapshots normalize and author selection is required. Preserve source hashes at capture time; label individual-image inspection separately from sheet inspection and captured-only support.

The consistency tooling is a separate gate. A passing generated graph, style check or geometry matrix does not replace rendered judgment. Missing parameter combinations remain unvisited; agent review does not grant human color approval or application API/persistence proof.

## Reference evidence inspected

- Read AGENTS.md, UX UI/WORKFLOW.md, book README/PRINCIPLES/CAPTURES and owning action/dialog/status/back/loading/scale records.
- Read selected Round10 direction including later quiet-back, geometry/depth and recovery corrections.
- Opened `US-025/color-playground/round10-list-desktop.jpg` and `US-025/sources/current-mobile-invitations.png` as comparison inputs. The latter is a source screenshot with a narrow crop; it is not a full current-phone acceptance image.

Awaiting candidate-source readiness before current renders.
