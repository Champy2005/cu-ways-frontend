# US026 · Proof of delivery design handoff

> Current handoff: [interactive HTML demo](demo/index.html), based on the story requirements and canonical states below and using shared theme 1.6.0. Current component evidence and fresh independent review are in the [design book](../book/index.html#us026-proof). The older SVG masters and viewer remain read-only provenance. Import/rebuild instructions below document the archive and are not authorization to update Figma.

The archived local design is complete. Figma import was deferred by the user after the existing file's three-page Starter limit blocked a new page. No Figma content was moved or replaced. The new HTML handoff is a design simulation; no frontend, backend, API contract or database changes were made.

### Targeted live-prototype update · 25 October 2026

Only the **Try the flow** view in `design/index.html` uses shared theme 1.3.0 `banner` and `feedbackBlock` markup for its error, warning, informational and success feedback. Recovery actions are adjacent siblings outside each painted banner and use the shared recovery action and refresh icon where applicable. The local mock transitions, draft retention and reconciliation behavior remain illustrative. This is a scoped prototype repair, not full US-026 adoption; the flow board and 29 SVG masters retain their historical 1.0.0 styling. SVG/Figma material remains unchanged.

## Requirements and provenance

The original workbook `C:/Users/thana/Downloads/Backlog (3).xlsx` supplies these requirements:

| Source | Required behavior | Design evidence |
| --- | --- | --- |
| Project Backlog, row 27 | A marketer submits delivery links for an In Progress job | A01–A03, A05 |
| Project Backlog, row 27; Sprint III, row 38 | Save URL, `attachment_type: Proof` and `upload_at` | A04, A06 |
| Sprint III, rows 28–30 | Upload section, proof list with URL/timestamp, invalid-type alert | Chapters 01, 02 |
| Project Backlog, row 27; Sprint III, row 36 | Attachment types are limited to Brief, Proof and Other | B02; this form always supplies Proof |
| Sprint III, row 37 | Only permit new proof while the job is In Progress | C02 |

Inspected current code: the backend Attachment domain has Brief/Proof/Other and URL/upload_at fields. The OpenAPI describes Brief attachments, but no proof submission endpoint was found in that contract. The design does not claim that the new behavior is implemented or that a particular proof route, request shape, pagination contract or HTTP error code has been agreed.

## Read the board

The entry overview explains three steps: paste a delivery URL, save as Proof, review the evidence. Main path frames A01 → A02 → A03 → A04 → A05 → A06 are arranged left to right. Each arrow names its triggering action. Error chapters show the recovery destination beside the failed state rather than hiding transitions in frame descriptions.

| Chapter | Purpose |
| --- | --- |
| 00 | Large story title and three-step map |
| 01 | Everyday mobile light flow, including pending and confirmed saves |
| 02 | Incorrect URL versus rejected attachment type; red correction arrows |
| 03 | Interrupted save: refresh reveals either an existing proof or a confirmed miss |
| 04 | Loading, failed read, changed job status and lost access |
| 05 | Desktop form/list layout and saved-list states |
| 06 | Representative dark mobile flow and recovery states |
| 07 | Desktop recovery and a dark desktop saved list |
| 08 | 320px long-link and 200% text full-content references |

Titles are actual editable text layers: 110px story marker, 100px overview title, 44–64px chapter headings and 25px scenario headings. They remain part of exported/pasted artwork. They do not change Figma's own frame-label preferences. Chapter navigation and bounded story groups are the primary solution to losing context at extreme zoom-out; no text remains readable at arbitrarily small scale.

The 29 masters cover the 14 canonical states and selected device/theme companions; they are not a complete Cartesian matrix. Repeated frames in a chapter provide a visible recovery destination without increasing the unique master count.

## Interaction and copy decisions

These are proposed UI choices where the backlog does not specify details:

- **Input:** one required web URL, submitted independently. Accept full HTTP(S) URLs; trim surrounding whitespace. Reject unsupported schemes with a field error. URL syntax is distinct from remote existence, permissions or safety; the UI asks the marketer to check sharing access. Do not claim that the link was tested.
- **Type:** this proof form sets Proof itself. It has no Brief/Other dropdown. An attachment-type rejection is a server save failure, not an unsupported file-extension message. “Reopen proof form” retains the URL and rebuilds the request with Proof. If rejected again, keep the explicit failure rather than claiming success.
- **Empty/pending:** Save is unavailable for an empty draft. A malformed nonempty draft can be submitted for inline validation. A pending request has a “Saving proof…” label and blocks another save. The local neutral disabled paint is a scoped proposal, not a new global disabled-color rule.
- **Confirmed save:** show success only after a server-confirmed response, then clear the draft. Display the actual saved URL and server-generated timestamp, newest first. Fixture dates are illustrative; implementation converts the returned instant into the viewer's timezone and includes a timezone label. The prototype uses ICT for this workspace's sample.
- **Multiple links:** “Add another proof” opens a new form while retaining the existing evidence. Links open a new tab with an external-link cue. Long URLs wrap; do not abbreviate away the only visible URL. No edit/delete feature is proposed.
- **Unknown outcome:** retain the unsaved URL, remove the immediate Save action, and offer “Check saved proof.” Refresh the authoritative list before deciding whether to show the saved proof or explicitly retry. The backend should supply attachment identities and a reliable reconciliation/idempotency strategy; URL equality alone is not sufficient for concurrency or legitimate repeated links. A failed refresh stays unresolved and does not authorize another submission.
- **Failed initial read:** do not show “No proof added yet” when the list is unavailable. Loading, failed read and genuine empty state have separate frames.
- **Status/access:** refresh status before allowing submission; backend permission and job-status checks remain authoritative. Once status changes, offer refresh and remove the form. If access is denied, remove private job metadata, proof URLs and the draft. A separate sign-in fixture is not designed here; authentication recovery should use the shared application flow.
- **Completion:** proof submission leaves the job In Progress. US027 owns the completion guard and warning; US028 owns cancellation. This package does not implement those stories.

Keyboard implementation should associate label, helper and error with the URL input; focus invalid input, announce pending/success/errors, and return focus to a reopened form. The prototype demonstrates these local behaviors. Its navigation is illustrative; it is not a full product router. Production keyboard, screen-reader, backend, virtual-keyboard and browser-zoom validation remain implementation work.

## Theme and composition

Shared theme 1.0.0 is the provenance for the 29 archived SVG masters' palette and visual action roles. The HTML demo instead uses the current shared theme 1.6.0 recipes and components. Marketer typography remains Inter. The demo uses an in-flow Save action because the short URL form does not need a floating persistent tray. Its current layout uses one saved-proof workspace with a compact Add proof entry that expands an inline form above the evidence. This handoff does not update archived masters or establish application implementation.

The clean SVG masters are full-content references, with a minimum 1000px presentation height that grows for extra content. They are not device viewport captures or a fixed-height product prescription. The 200% text frame grows its navigation as well as its content. Implement intrinsic sizing, normal page scrolling, minimum 44px targets, safe-area clearance, visible focus, reduced-motion and opaque fallback in the actual app.

## Later Figma import

The requested destination is [SE UX/UI](https://www.figma.com/design/XMwuViKKwBvZFBqsVP6PAx/SE-UX-UI). Retain all existing pages. When a page slot is available, create `US-026 · Proof of delivery`.

1. Open the local viewer and choose a chapter. Click **Copy chapter SVG**, then paste onto the new Figma Design canvas. Alternatively import `design/figma-paste-complete.svg` for the complete organized board, or import individual files from `design/screens/`.
2. Install the bundled official Inter fonts if Figma reports missing fonts. Preserve text as text and vectors as vectors.
3. Check that the pasted chapter contains named scenario groups and clean `Screen__…` children, readable URLs, source artwork and arrowheads. Compare representative Light/Dark and long-link references to the local viewer.
4. Native Figma sections, Auto Layout, reusable components, variable bindings and prototype interactions can be added after import. SVG masters do not claim those capabilities. Figma import has not been verified because it was deferred.

The complete board's named hierarchy is suitable for later grouping into native sections. Descriptions are reserved for minor request/reconciliation and implementation details; the main tasks and correction paths are visible on the canvas.

## Verification and limits

`design/qa/structure.json` records SVG parse, unique layer IDs, measured line wrapping, text screen bounds and transition-target checks. `design/qa/render.json` records rasterization. `design/qa/browser.json` records observed preview branches. Browser screenshots are local evidence only. The current HTML demo's focused checks and proof limits are documented in [demo/README.md](demo/README.md).

These checks establish the local design package and mock interaction behavior. They do not establish API, database, authorization, remote-link accessibility or Figma import correctness. Future implementation must inspect both repository contracts and run the owning repositories' required checks.

The live loading sample also uses the shared pending/info message. Its fixture-only “Finish loading sample” control lives in the author controls outside the product preview, not in the banner or product task flow. Focus uses the shared focus-visible recipe; no story-specific banner frame is painted for every pointer-triggered focus.
