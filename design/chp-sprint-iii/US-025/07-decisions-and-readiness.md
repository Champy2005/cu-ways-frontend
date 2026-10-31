# Decisions and implementation readiness

> **Current presentation authority · 1.6.0:** Read the [design book](../book/README.md), [human principles](../book/PRINCIPLES.md) and canonical [scenario model](model/scenarios.json). Older copy, layout and pending-dismissal descriptions below are retained research/provenance, not current presentation requirements. Current UI uses concise Contract/survey hierarchy and declarative bounded dialogs. Pending operations can dismiss/reopen with12-second unknown/read recovery; closing UI does not claim rollback. Offline Start opens feedback without a write. Domain eligibility, access and server-authority requirements still apply.

## Reviewed HTML baseline · 25 October 2026

Use [demo/index.html](demo/index.html) and canonical `model/scenarios.json` for interactive design. The Rose × Slate 1.3.0 proposal carries the selected Round 10 appearance and inspected frontend patterns forward with later explicit user corrections. Do not dismiss Round 10 as historical during visual comparison. Keep Figma/SVG read-only unless the user explicitly authorizes edits. The older decision tables below retain functional research and API proposals; visual sizes or layout rules that conflict with the accepted 1.3.0 decisions are superseded by the current theme/component/responsive documents.

Fresh, unbiased reviewers inspected the actual rendered HTML in both themes and the relevant responsive/keyboard states; see [coverage and limits](../REVIEW.md). Future material changes still require fresh review. The root evaluates each finding against the user decisions, source and rendered evidence, rejecting an inaccurate finding only with direct evidence. Green functional checks alone do not approve visual fidelity.

The HTML handoff is a deterministic local simulator. It can demonstrate branches, keyboard interactions and visual/motion parameters; it does not implement or prove product authorization, API semantics, concurrency or persistence. Application integration remains separate work. US-026 has existing design material awaiting adoption/audit; it is no longer an assignment-only stub. Other stories retain their documented readiness.

## Decisions made for this proposal

| ID    | Decision                                                                              | Basis / status                                                                                                                                                             |
| ----- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DEC01 | Explicit hired-marketer Accepted→In Progress                                          | US-025 story + US-023 criteria; stronger coherent requirement than old auto-start wording. Story-owner reconciliation still required before code.                          |
| DEC02 | Include minimal My Jobs list + detail                                                 | Explicit user answer21 Oct 2026. Additional scope outside original1.5h UX estimate.                                                                                        |
| DEC03 | New marketer routes under existing Inter marketer shell                               | Existing generic jobs routes are placeholders with a different shell.                                                                                                      |
| DEC04 | Dedicated authorized hired-job read contracts                                         | Existing marketer request shape lacks selected offer/terms; Creator job-detail endpoint cannot supply marketer access. Reusing request status alone was rejected.          |
| DEC05 | Atomic idempotent state-only Start keyed by job ID                                    | Handles duplicate/timed-out requests without trusting client offer ID or rerunning hiring effects. Proposed contract awaiting backend agreement.                           |
| DEC06 | Job #ID plus linked survey names                                                      | Job model has no campaign-title field; do not infer schema from mockup copy.                                                                                               |
| DEC07 | Intrinsic content-driven responsive layout; no global 1200px feature or 344px aside rule | Preserve usable reading width and action discovery without turning a study frame into a page template.                                                                     |
| DEC08 | Mobile floating tray contains only Start; desktop Start stays in the action panel   | Keep Start reachable on mobile while avoiding a persistent desktop overlay.                                                                                                |
| DEC09 | In Progress uses existing info blue only in US-025 surfaces                           | Align Figma active-work convention without unrelated dashboard repaint.                                                                                                    |
| DEC10 | Runtime semantic action family and Inter, with scoped dark-button contrast correction | Existing action family governs visual language; white on existing dark action measures4.44:1, so04 defines scoped derived backgrounds above 4.5:1. No global token change. |
| DEC11 | No payment/proof/deadline blocker added                                               | No such start prerequisite is in the story. Optional missing data stays optional.                                                                                          |
| DEC12 | No started_at/history/timer requirement                                               | Current schema lacks it; status transition is sufficient for this story.                                                                                                   |
| DEC13 | No live normal-DB fixture created                                                     | User authorized app inspection, not seeding/migration of their database.                                                                                                   |
| DEC14 | Shared header/menu/bottom-navigation align to the 1.3.0 component reference          | Header 72px without upper rim; plain controls 44px; logo 124px mobile/152px desktop; birds 51px; attached divided 48px-minimum menu rows; lower highlight/seam retained.   |
| DEC15 | One return action per route/state; compact accessible arrow pagination               | Detail has one plain top Back link; menu/card navigation does not duplicate it. Pagination exposes full previous/next names and current-page semantics.                      |
| DEC16 | Use shared Inter with explicit compact product density                               | Generic body remains 1rem/16px guidance; product density is 14px/1.55; content headings are 24–30px. In mobile detail, status and agreed price precede context.            |
| DEC17 | Accepted status panel has one heading and one explanatory sentence                     | Keep the Accepted badge, one “Ready to start” heading and “Your offer was accepted. Start when you begin the campaign.” in the panel. The mobile tray contains Start only; no decorative green rail. |
| DEC18 | Visual approval waits for fresh rendered review                                      | Review actual Light/Dark and responsive HTML; root resolves findings against direct evidence. Functional pass alone is not visual approval.                                |

## Rejected alternatives and implications

- Detail only without an entry list: user selected complete discoverability; there is no current marketer Jobs destination.
- Use Accepted invitation as proof of hire: wrong business meaning and no selected price/offer context.
- Creator-owned GET for marketer detail: permission mismatch.
- Start automatically when offer accepted: contradicts explicit US-025 action and erases the Accepted state.
- Optimistic In Progress or automatic POST retry after timeout: may misrepresent commit state or duplicate later side effects.
- Assume a successful Accepted GET means the original timed-out request cannot commit: false for in-flight operations; safe retry depends on atomic idempotency, not a read alone.
- Copy fixed frame coordinates literally into every page: retain the selected Round 10 appearance for comparison while letting stories use intrinsic layout and current shell behavior.
- Add notification, audit timestamp, undo, proof upload, payment or completion controls: adds unspecified behavior and dependencies.

## Remaining contract decisions before product implementation

1. **Story owner:** correct Pending-auto-start/trigger criteria to the explicit two-step hiring/start lifecycle; confirm no second synchronization trigger is required alongside current Go transaction.
2. **Backend owner:** accept or revise05's hired-job read/start DTOs, pagination, ownership/privacy errors and idempotent repeat-start semantics; implement/document them in OpenAPI before generating frontend types. Decimal price strings and existing date/link shapes should remain consistent.
3. **Frontend/design owner:** review My Jobs navigation fit and responsive composition against the current runnable HTML demo and inspected marketer shell. Do not assume the frontend already adopts these shared theme decisions.

These remaining owner decisions are explicit dependencies, not questions hidden in frontend implementation. The user authorized design production; Figma/SVG remain unchanged unless the user explicitly authorizes updates. Application implementation still requires its own work.

## Verdicts by scope

| Scope                                            | Verdict                             | Evidence / limitation                                                                                                |
| ------------------------------------------------ | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Round 10/Figma visual comparison material       | VERIFIED as read-only input         | Retained for comparing the selected appearance; later user corrections take precedence.                              |
| Current app desktop/phone reference patterns     | VERIFIED for inspected demo screens | Saved screenshots; no hired-job flow exists.                                                                         |
| Backend starts and database responds             | VERIFIED for health/readiness       | Both GETs200; no business-transition proof implied.                                                                  |
| Repo preservation                                | VERIFIED at inspection checkpoint   | Both Git statuses clean; final recheck recorded after research.                                                      |
| HTML UX/state/layout handoff | VERIFIED for documented local cases | Independent rendered review, explicit story model and local interaction checks; see ../REVIEW.md. This does not establish application behavior. |
| US-025 runtime/auth/concurrency/persistence      | INCONCLUSIVE / not implemented      | No endpoint/UI/approved authenticated disposable fixture exists.                                                     |
| Earlier Figma/SVG artifact status                | Existing, unchanged                  | Earlier static frames remain comparison material; they do not prove the current 1.3.0 HTML render is accepted.                                                             |

## Earlier resumption notes (HTML-first workflow now owns production)

Read README then 01–07. Keep the selected Round 10 appearance available for visual comparison. Review proposed API decisions separately before product implementation. Only an authorized implementation task changes the application repositories. This folder can be extended story by story; US-026/027/028/034 retain their documented readiness.


## Polished v2 clarification (22 October 2026)

The earlier v2 manifest and annotated frames remain supporting context; their visual decisions do not override the current 1.3.0 proposal or later user corrections. Inter and authentic CUWAY/bird assets remain in use. The 200% text, constrained dialog and signed-out recovery notes remain useful behavior/accessibility cases where they agree with current requirements. Signed-out recovery proposes a safe login return URL and fresh GET, never automatic POST replay. R12 is a known rejected start followed by a failed status read: “Latest status unavailable. Your start request was rejected. We couldn’t load the latest job status. Refresh before trying again.”
