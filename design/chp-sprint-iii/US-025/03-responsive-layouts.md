# Responsive composition and behavior

> **Current presentation authority · 1.6.0:** Read the [design book](../book/README.md), [human principles](../book/PRINCIPLES.md) and canonical [scenario model](model/scenarios.json). Older copy, layout and pending-dismissal descriptions below are retained research/provenance, not current presentation requirements. Current UI uses concise Contract/survey hierarchy and declarative bounded dialogs. Pending operations can dismiss/reopen with12-second unknown/read recovery; closing UI does not claim rollback. Offline Start opens feedback without a write. Domain eligibility, access and server-authority requirements still apply.

Updated 25 October 2026 for the Rose × Slate 1.3.0 feedback revision. See [rendered coverage and limits](../REVIEW.md). Use the [HTML story demo](demo/index.html) with the [shared theme](../theme/README.md). Keep the selected Round 10 appearance and inspected frontend available as visual-comparison inputs; later explicit user corrections take precedence. These are component and content-order decisions, not fixed page coordinates.

## Shared shell, typography and local composition

The lab and story use the same shared header, attached menu and bottom-navigation markup and recipes. Preserve the authentic CU Ways logo and role-bird artwork, theme control, skip link, semantic landmarks and keyboard focus. The shared header target is 72px high, with plain header controls at least 44px, logo width 124px on mobile/152px on desktop, and 51px role-bird artwork. Let the header grow or wrap when enlarged text needs room; do not clip content or shrink control hit areas. The header has no bright upper rim; its lower edge keeps a 2px highlight and separate 1px seam.

The plain menu attaches directly to the header and uses divided 48px minimum-height rows, growing rows when text wraps. It overlays the page instead of pushing its content. Keep the menu control and decorative artwork semantically distinct. The host owns focus management, route availability, dismissal and responsive presentation.

Use Inter across the shared design. Generic body text retains the 1rem/16px guidance. Product content uses the explicit compact density of 14px text with 1.55 line-height; main content headings range from 24px to 30px. Allow text and controls to wrap and grow. Page gutters around 1–2rem, section gaps around 1–2rem, and adjacent-control gaps around .4–.75em remain starting guidance, not template coordinates. Prefer intrinsic grid/flex sizing, `minmax(0,1fr)`, unitless line-height and relative spacing.

The mobile bottom navigation shows the short labels **Home**, **Jobs** and **Invites** at 11px with a 14px line-height. Its selected state uses the filled icon and stronger caption without a tile/frame/marker; keep each 64px destination target and visible keyboard focus. Desktop navigation displays full labels horizontally at 14px and retains the moving selection tile with filled selected icons. Preserve complete accessible destination names. Navigation mode is presentation only and never controls permissions.

## List and pagination

Group My Jobs and its filter coherently. Omit the redundant hired-jobs subtitle unless a new context needs it. Repeated cards show the appropriate identity/context, lifecycle badge and View job entry action; there is no inline Start on the list. A narrow composition stacks naturally; a wide composition may separate context and status/action regions when both remain readable.

Use compact visible arrow controls for pagination, with full accessible names such as “Previous page” and “Next page”. Expose the current page semantically and retain real link behavior for page navigation. Long result sets or enlarged text may wrap or reflow the controls; do not reduce the accessible labels to preserve one row.

## Detail, return navigation and action placement

Use one return action for each route/state. A normal detail page has one plain muted Back link above its title. Do not add a second Back link inside its status or context card. A card-context navigation link is allowed only if the page has no equivalent link to that destination. Feedback banners remain message-only regions; their recovery actions are adjacent siblings.

On mobile detail, show status and agreed price before the context fields. The Accepted status panel contains the badge, one `Ready to start` heading, and one sentence: “Your offer was accepted. Start this job when you begin the campaign.” Keep agreed price distinct from payment/payout state. The floating mobile tray contains only the Start button; do not repeat the heading or explanatory sentence there. Do not add a decorative green rail.

On mobile, use a floating tray that contains only the Start button, visually separated from bottom navigation. On desktop, place Start inside the detail action panel; do not show a floating tray. The host measures the mobile tray and navigation at the rendered text size, observes resize and wrapping, accounts for safe area once, and clears the final content and every focused control. At short heights, enlarged text or an open virtual keyboard, move the action into normal flow or another compact in-flow arrangement. Preserve a visible Start action without covering content. Do not export fixed offsets, tray heights or z-index ladders globally.

## Dialog and overlays

The confirmation fits its content with a bounded reading width. Its body or whole dialog scrolls at constrained heights; Cancel/Confirm/Close remain reachable at enlarged text. Pending has disabled dismissal controls, no duplicate activation and a visible busy label. A pre-submit dismissal sends no start request and returns focus to the invoking action. Safe navigation while pending follows the specified reconciliation route rather than asserting rollback.

The shared menu overlays content directly beneath the header. Modal layering and focus behavior belong to this host, not token values. At short heights and when zoomed, keep the complete confirmation reachable and preserve visible focus targets.

## Review conditions

Render both themes at narrow and wide widths and at short landscape height. Include long/localized and optional content, both navigation classes, 200% text, browser zoom/reflow, keyboard-only operation, reduced motion and reduced transparency. Check the 72px header reference, 44px control targets, 124px/152px logos, 51px birds, attached 48px menu rows, navigation labels, pagination names, one Back action, mobile-only Start tray, desktop action panel and mobile status/price order in the actual composition. A preview width selector is composition evidence; it does not replace native-device safe-area, keyboard or real zoom checks.

Have a fresh, unbiased reviewer inspect the rendered results against the accepted user decisions, Round 10 appearance, inspected frontend and these cases. The root evaluates each finding against direct source and render evidence and may reject an inaccurate finding with a specific explanation. Functional green checks alone do not approve visual fidelity. Record any missing proof explicitly in the handoff.

## Measured reflow and paging focus

The compact bar measures the longest caption and minimum target, then uses balanced rows when one row will not fit. Verify the label rectangles themselves; a 320px-wide document can still have collisions between labels inside fixed cells. The normal five-item 64px bar is unchanged. Reflowed navigation height feeds the tray and content-clearance measurements. Late font loads also remeasure the desktop selected tile.

The local paginator uses 44px arrow targets, a short current/total indicator and full accessible names. It is omitted for one page. During a page read the arrows are disabled; after settlement, focus and scroll to the first new result with a keyboard-visible indicator, while filter operations retain filter focus.

## Feedback placement

A route-level message follows the page heading and precedes the job content. Its related recovery controls are immediately below the message in the shared unpainted action group. List read feedback sits between filter/header and retained results. Compact US-025 actions span their available group; wider compositions use intrinsic controls with a relative target starting size. These are host layout choices, not fixed global page coordinates. Title/body-only messages use the same copy column and first-line icon alignment. Start remains in the task panel/tray; recovery placement does not duplicate or relocate the primary transaction control.

The short/enlarged-text fallback measures the real heading/filter lead-in before feedback as well as chrome height and reading headroom. If those cannot fit together, bars enter document flow so the banner starts visibly rather than behind a fixed bottom bar. This content-based rule has no per-scenario pixel override.
