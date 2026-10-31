# Components, styling and exact copy

> **Current presentation authority · 1.6.0:** Read the [design book](../book/README.md), [human principles](../book/PRINCIPLES.md) and canonical [scenario model](model/scenarios.json). Older copy, layout and pending-dismissal descriptions below are retained research/provenance, not current presentation requirements. Current UI uses concise Contract/survey hierarchy and declarative bounded dialogs. Pending operations can dismiss/reopen with12-second unknown/read recovery; closing UI does not claim rollback. Offline Start opens feedback without a write. Domain eligibility, access and server-authority requirements still apply.

Updated 25 October 2026 for the Rose × Slate 1.3.0 feedback revision; see [rendered coverage and limits](../REVIEW.md). The current design surface is [the runnable HTML demo](demo/index.html); global components and parameters live in the [shared theme](../theme/README.md). Keep the selected Round 10 appearance and inspected frontend available as visual-comparison inputs. Later explicit user corrections override those references.

## Authority and ownership

Visual authority is current explicit user decisions → selected Round 10 appearance and inspected frontend as comparison inputs, corrected by later user decisions → shared theme/component defaults → named story specialization → instance composition. Accepted story requirements continue to own behavior and copy. The current application is an integration reference, not a second palette. [Frontend adoption](../theme/ADOPTION.md) remains separate work; this demo does not repaint the product.

The global lab and story consume the same `theme/components.mjs`, `recipes.css` and generated tokens. US-025 owns its fixtures, exact messages, eligibility/state machine and content-driven layout. See [the component API](../theme/COMPONENTS.md) and [parameter explanations](../theme/PARAMETERS.md); do not copy literals or screen coordinates into a second story theme.

## Shared component choices

| Component | US-025 usage | Contract |
| --- | --- | --- |
| Lifecycle badge | Accepted → info; In Progress → progress; Completed → success; Cancelled → neutral | Noninteractive icon and label. Unknown status is neutral Status unavailable; loading/mutation states are not lifecycle values. |
| Primary action | Start job / Starting… | Native button; explicit confirmation, single-flight mutation, readable busy label and smooth single-arc spinner. |
| Secondary action | Utility Refresh beside Start; Recovery Try again/Refresh when recovery is the main task; Entry View job in a repeated card | Choose context explicitly; operation wording does not choose emphasis. Stable fill, shared hover/pressed/focus behavior. |
| Tertiary action | Optional functional action or lower-priority navigation inside a card | Bounded quiet fill/border, flat at rest with subtle functional hover elevation; compact tools stay flat. |
| Feedback banner | Error, info or success text above the relevant region | Neutral title/body; semantic icon, fill and accent rail. Error uses a red icon and 5px rail with a neutral outer border. **No action/link/button descendants.** Actions are adjacent siblings outside the announcement. Unreviewed warning paint remains guidance. |
| Contextual navigation | One plain muted Back link at the top of a normal detail page | Do not repeat the same return inside a card. Card-context navigation is allowed only when the page has no equivalent destination. Keep URL navigation as anchors and operations as native buttons. |
| Header and menu | Shared header/menu markup and recipes are consumed by the lab and story | Header target 72px; plain controls at least 44px; logo 124px mobile/152px desktop; bird artwork 51px; divided attached menu rows 48px. No upper rim; the lower header edge keeps its 2px highlight and 1px seam. Grow/reflow for enlarged text. |
| Bottom navigation | Shared nav; Home/Jobs/Invites captions on mobile and full horizontal labels on desktop | Mobile caption 11px/14px line-height, filled selected icon without tile/frame/marker and 64px target; desktop keeps its moving selection tile. Keep full accessible names, route-derived selection and a separate visible focus state. |
| Pagination | Compact visible arrow controls | Give arrows complete names such as “Previous page” and “Next page”; expose current page semantically and keep navigation destinations as anchors. |
| Start placement | Mobile floating tray with only Start; desktop Start in detail action panel | Host measures mobile tray/navigation, clears final content/focus and safe areas. Do not show a floating tray on desktop or include Refresh in the mobile tray. |
| Confirmation | Native modal in normal, submitting and slow states | Cancel initially focused (visible title for overflowing content), background inert, focus constrained, pending dismissals blocked, return focus handled by the host. |

Use Inter as the shared font family. Generic body text retains the 1rem/16px guidance; compact product surfaces use 14px text at 1.55 line-height, with main content headings from 24px to 30px. In mobile detail, place status and agreed price before the remaining context. The Accepted status panel has one `Ready to start` heading and one explanatory sentence. Keep that copy in the panel; do not repeat it in the mobile tray, which contains only the Start button. Do not add a decorative green rail. Default paints and effects are recorded in `theme.json`; disabled/busy refinements and unshown controls remain guidance. Exact field/spacing/radius choices in the demo are local composition, not new global layout rules.

## Historical sources

The old marketer `--mk-*` mappings, outlined primary secondary buttons and Figma component-production instructions are superseded as implementation directions. Preserve the selected Round 10 appearance as a visual-comparison input; do not dismiss it as historical. Later user corrections and the current 1.3.0 baseline guide this handoff. API/state requirements and exact copy below remain story-owned.

## Copy catalogue

| Key                   | Exact text / action                                                                |
| --------------------- | ---------------------------------------------------------------------------------- |
| page.list.title       | My Jobs                                                                            |
| page.list.description | Historical optional subtitle; omitted from the current demo.                                                        |
| page.detail.title     | Job #{id}                                                                          |
| ready.title           | Ready to start                                                                     |
| ready.body            | Your offer was accepted. Start when you begin the campaign.               |
| ready.action          | Start job                                                                          |
| confirm.title         | Start this job?                                                                    |
| confirm.body          | This will change the job status from Accepted to In Progress.                      |
| confirm.secondary     | Cancel                                                                             |
| confirm.primary       | Start job                                                                          |
| pending.action        | Starting…                                                                          |
| pending.slow          | This is taking longer than usual. We’re checking the job status.                   |
| success.title         | Job started                                                                        |
| success.body          | Status changed to In Progress.                                                     |
| progress.title        | Work has started                                                                   |
| progress.body         | This job is in progress.                                                           |
| already.body          | This job is already in progress.                                                   |
| checking.body         | Checking job status…                                                               |
| unknown.title         | Start status not confirmed                                                         |
| unknown.body          | We couldn’t confirm whether this job started. Refresh to check its current status. |
| reconciled.accepted   | The latest check shows Accepted. A new confirmation is required to start.                                |
| terminal.body         | This job is now {status} and can’t be started.                                     |
| denied.title          | Unable to start job                                                                |
| denied.body           | You don’t have permission to start this job.                                       |
| unavailable.title     | Job unavailable                                                                    |
| unavailable.body      | This job couldn’t be found or you don’t have access to it.                         |
| membership.title      | Marketer access required                                                           |
| membership.body       | Use an account with marketer access to view hired jobs.                            |
| auth.body             | Your session expired. Sign in to check this job’s status.                          |
| auth.action           | Sign in                                                                            |
| invalid.body          | This job isn’t ready to start. Refresh its details or contact support.             |
| stale.body            | Couldn’t load the latest details. Showing the last confirmed information.          |
| list.error            | Jobs couldn’t load. Check your connection and try again.                                                     |
| detail.error          | Job details couldn’t load. Check your connection and try again. No start request was sent.                                              |
| offline.body          | You’re offline. Reconnect and refresh this job before starting it.                 |
| missing.brief         | No brief attached                                                                  |
| missing.deadline      | No deadline set                                                                    |
| missing.target        | Target not specified                                                               |
| missing.link          | Link unavailable                                                                   |
| context.price         | Agreed price                                                                       |
| context.delivery      | Agreed delivery                                                                    |
| missing.delivery      | Not specified                                                                      |
| common.refresh        | Refresh job                                                                        |
| common.back           | Back to My Jobs — render once at the top of the normal detail route; omit an equivalent duplicate inside a card |
| feature.unavailable   | My Jobs isn’t available yet. Please return to your overview.                       |

Use job ID and survey titles exactly as returned/derived; do not invent a campaign title or label a job budget as accepted price. Only render dates/targets/start timestamps if supplied. All displayed monetary values include THB formatting; no promise of payout/payment status is implied.

## Accessibility and timing

Use semantic headings, navigation and definition lists. Keep full accessible names on the compact pagination arrows and expose the active page with `aria-current`. Existing Base UI alert-dialog/confirmation primitive is a reuse candidate; use its focus-trap behavior rather than an ad hoc div. Initial focus Cancel avoids accidental Enter confirmation. For overflowing dialog content, initially focus its visible title with tabindex=-1 so the explanation stays in view; confirmation still requires explicit activation. Tab cycles inside; Escape/outside closes only before submission; close restores trigger focus. On success or loss of eligibility focus the detail heading (trigger no longer exists). On detail disappearance focus unavailable heading. After revalidation do not steal focus repeatedly.

Success/info updates announce once with role=status/polite; explicit errors role=alert. The badge itself is textual and not a second live region. On initial loading aria-busy and one loading label; skeletons aria-hidden. Preserve focus when changing filter/page and announce result count without forcing focus unless a full page navigation occurred. Reduced motion disables shimmer/transitions/spinner rotation while retaining visible pending text. No auto-dismiss timer on uncertainty or rejection banners. Success may be dismissed manually; persistent badge remains.


## Earlier v2 clarification (22 October 2026)

The HTML-first workflow and responsive focus guidance above supersede the old geometry and initial-scroll behavior in this note. This does not remove Round 10 as a visual-comparison source; later user corrections remain controlling.

The v2 manifest and annotated frames supersede older example geometry/copy. Inter and the authentic CUWAY/bird assets are authoritative. Dark WAY/arrow contrast is corrected without changing geometry. At 200% text mobile navigation uses two rows. At 360×225 CSS pixels the entire confirmation dialog scrolls; initial Cancel focus brings its footer into view. Normal-height dialogs keep the footer reachable with a scrolling body. Signed-out recovery proposes a safe login return URL and fresh GET, never automatic POST replay. R12 is a known rejected start followed by a failed status read: “Latest status unavailable. Your start request was rejected. We couldn’t load the latest job status. Refresh before trying again.”

## Feedback composition refinement · 1.3.0

Live banners use the canonical model copy through the shared `banner`/`feedbackBlock` recipes. L07 states once that previously loaded results are shown. R01/R13 expose one visible polite checking message with the shared pending icon. R03 is an informational confirmed Accepted result, not an unresolved warning; Start still requires a new explicit confirmation. R04 retains uncertainty, and R12 distinguishes a rejected start from a failed latest read. Recovery controls are adjacent to their message, outside it; no duplicate Refresh remains in the status card. Primary Start remains in the task panel/tray, disabled or absent under the existing state rules. The status/price card labels last-confirmed data without repeating the banner's explanation.
