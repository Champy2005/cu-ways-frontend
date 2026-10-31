# Shared component contract

Current1.9: `lifecycleBadge(label,{attrs})` owns lifecycle icon/tone; generic badge must not represent a lifecycle state. `action(label,{variant})` owns six roles: primary, secondary, tonal, outline, utility, quiet. Functional View proof/activity use tonal; Add delivery proof uses secondary; safe Keep job/In Progress use outline; Stop waiting uses utility; quiet is acknowledgment/return only. Quiet content hover remains transparent with text emphasis; no filled container. More content tools use explicit outline+compact with a reserved visible hit area. No new fades. Purple was rejected; slate-blue/blue-teal replacement remains pending human judgment.


The CU Ways Rose × Slate 1.9.0 feedback revision is described here; see [current review status and limits](../REVIEW.md). Shared markup lives in [components.mjs](components.mjs); its opt-in appearance lives in [recipes.css](recipes.css), backed by generated [tokens.css](tokens.css). The [theme lab](lab.html) and [US-025 story demo](../US-025/demo/index.html) consume the same shared header, attached-menu, bottom-navigation, action and status recipes. They are the starting point for future HTML handoffs. The selected Round 10 appearance remains a visual-comparison input, with later user corrections taking precedence. The complete values and parameter meanings are in [REFERENCE.md](REFERENCE.md) and [PARAMETERS.md](PARAMETERS.md).

The snippets below show the exported markup API. Pass only static, author-controlled HTML in the optional `attrs` field; it is appended to generated markup and is not a safe place for user-provided strings. Labels, body text and `href` values are escaped/checked by the shared helpers.

## Actions: emphasis, context, intent, format and state

`action(label, options)` accepts an explicit variant (preferred), legacy emphasis, a secondary context, optional intent, format, destination, icon and state. The hierarchy is explicit; copy such as “Save” or “Refresh” does not choose the role.

| Option | Values | Contract |
| --- | --- | --- |
| `variant` | `primary`, `secondary`, `tonal`, `outline`, `utility`, `quiet` | Canonical visual role; has priority over legacy emphasis/context. Intent stays independent. |
| `emphasis` | `primary`, `secondary`, `tertiary` | Primary is the main commitment. Secondary supports that commitment. Tertiary is an optional low-emphasis operation or navigation affordance. |
| `secondary` | `utility`, `entry`, `recovery` | Select the secondary context. Utility supports the main operation, Entry opens a repeated item, and Recovery is the main way out of an unsuccessful read/action. |
| `intent` | `destructive` is the defined treatment | Destructive intent is separate from emphasis. The reviewed combination is primary + destructive. Other destructive contexts need their own review. |
| `format` | `compact` | Compact is an icon tool with a visually hidden text label. Keep a meaningful label in the markup; the icon alone is decorative. Content More tools explicitly use outline; compact quiet pagination has a tonal circle/inset edge on hover and no rest border. Neither uses elevation. Header/toolbar utilities use the separate plain `headerControl` primitive; do not put tiered action buttons into application chrome. |
| `href` | Omit for operation; provide for navigation | An operation renders as a button. A destination renders as an anchor. Do not use a button just because a link looks button-like. |
| `busy` | Boolean | Prevents button activation, exposes `aria-busy`, shows a spinner and retains the visible label. It must correspond to a real pending state in the host state machine. |
| `disabled` | Boolean | Uses native disabled behavior for buttons and disabled-link semantics for anchors. The visual disabled paint is provisional; there is no approved global opacity treatment. |

```js
import { action } from './components.mjs';

action('Start job', { emphasis: 'primary' });
action('Refresh job', { emphasis: 'secondary', secondary: 'utility', icon: 'refresh' });
action('Open job', { emphasis: 'secondary', secondary: 'entry', href: '/marketer/jobs/42' });
action('Try again', { emphasis: 'secondary', secondary: 'recovery', icon: 'refresh' });
action('Delete draft', { emphasis: 'primary', intent: 'destructive' });
action('More options', { variant: 'outline', format: 'compact', icon: 'more' });
```

The host still owns submit handling, duplicate-request prevention, loading rules and permissions. CSS alone does not guard activation. Keep the base fill and label readable during busy state; do not fade the entire action, its focus ring or its content.

## Feedback banners and adjacent actions

`banner({tone, title, body, id?, focusable?, pending?})` renders message content only. Every shape—title plus body, body only, or title only—uses one icon column and one copy column. Title and body share the same inline edge, text size and line height; the title uses weight 600. Empty messages are rejected instead of reserving a blank heading gap.

All copy stays neutral. Error uses a red icon/rail and its existing quiet fill. Warning uses a muted amber caution icon/rail on the Slate field fill. Info and success retain their own semantic signals/fills; neutral uses the field surface and muted signal. Every outer border stays neutral. These are feedback meanings, not action roles or lifecycle badge colors. Error uses `role="alert"`; the other tones use `role="status"` for polite updates. Use `pending: true` only with info/neutral for an ongoing read: its decorative spinner respects reduced motion, while the visible status text remains.

Use `feedbackBlock` whenever a message has related recovery controls. It returns a non-painted wrapper, the banner, and an immediate `.cu-feedback-actions` sibling. Structured descriptors call the shared native action renderer; they do not inject arbitrary action HTML into a message:

```js
import { banner, feedbackBlock } from './components.mjs';

feedbackBlock({
  tone: 'error',
  title: 'Could not load jobs',
  body: 'Check your connection and try again.',
  actions: [{ label: 'Try again', icon: 'refresh', attrs: 'data-action="retry"' }]
});
banner({ tone: 'info', body: 'Checking job status…', pending: true });
banner({ tone: 'success', title: 'Changes saved', body: 'Your changes are up to date.' });
```

Recovery descriptors default to secondary/recovery and accept the same options as `action`, including `href` for navigation. `attrs` remains trusted author-controlled binding markup. The banner's optional `id` is escaped; `focusable: true` adds `tabindex="-1"` for a deliberate post-update focus target. These do not move focus or issue requests themselves; the host owns behavior and announcement timing.

Retry, Refresh, Reopen and Check-saved controls sit beside the messages they resolve, outside the painted/live-region element. Primary task controls such as Start stay in their task panel/tray; they are not banner recovery actions. Do not repeat a message's Refresh control in that panel. Keep one visible stale-data explanation and distinguish confirmed status from last-confirmed data.

The wrapper scales with its host. The shared gap is relative to message text; it has no card paint, border or fixed page position. Hosts may use full-width actions in compact layouts and intrinsic targets on wider layouts. Reading width, route gutters and card position remain story choices. Render/test the adopting composition, including wrapped text and keyboard focus, rather than copying demo offsets.

## Back navigation, cards and links

`backLink(label, options)` always emits the same muted text/chevron return atom. Use one return per route/state. `inside: true` records context only; it does not change appearance. Useful forward navigation uses an explicit action variant instead of a competing Back treatment. Keyboard focus stays visible; pointer hover emphasizes text without painting a button box.

The theme supplies semantic surface, border and radius variables, but there is no generic card component or page layout recipe. The host composes each card from its actual content and binds the card surface variables. Do not copy `.sample-card` sizing, gutters or coordinates into another story as a shared standard.

```js
import { backLink } from './components.mjs';

backLink('Back to My Jobs', { href: '/marketer/jobs' });
backLink('Back to My Jobs', { inside: true, href: '/marketer/jobs' }); // same return atom
```

## Bars, navigation and floating trays

`navItem(label, iconName, {href, active})` renders a real anchor. `active: true` sets `aria-current="page"`; route state in the host owns selection. The shared navigation glyphs are home, services, jobs, invites and profile. Each has an outline rest form and a matching filled selected form in the same 24-unit SVG viewBox, rendered within a reserved 22px baseline slot. Hover is not selection, and keyboard focus remains separately visible.

The shared header uses a 72px reference height, plain controls with minimum 44px targets, a 52px compact/56px desktop role target, a 124px mobile/152px desktop logo and 51px role-bird artwork. The header has no bright upper rim. Its lower edge retains a 2px highlight and 1px seam. If text enlargement or zoom needs more room, grow or reflow the header rather than clip its contents. The plain attached menu begins at the header edge and has divided 48px minimum-height rows that can grow when text wraps. Shared markup and recipes are used by both the lab and story demo; the host still owns route availability, selection and responsive presentation.

Mobile bottom navigation uses the short Home, Jobs and Invites labels at 11px with a 14px line-height. Its selected state uses a filled icon and stronger caption without a tile, frame or marker; each destination keeps a 64px target, and keyboard focus stays separate. Desktop navigation displays full labels horizontally at 14px and retains its moving selection tile with the same filled selected icon family. Keep the complete accessible destination names even when a short mobile caption is visible. A desktop moving selection tile is only a visual layer: the host measures the actual current target after content, font, theme or size changes. The shared recipe does not own routes or menu focus. The host owns presentation choice, while the internal chrome measurements are shared. Bind the layout observers below after rendering so font loading, viewport changes and text enlargement update their measured geometry.

At normal text size the five mobile destinations share one row. `observeCompactNavigation` measures caption widths and target sizes; if they no longer fit, it selects balanced rows instead of letting labels overlap neighbouring targets. Row growth participates in the host’s measured tray/content clearance.

List pagination uses compact visible arrow controls with full accessible names, such as “Previous page” and “Next page.” Expose the current page with `aria-current="page"`; keep destinations real anchors when they navigate to another URL. The local mock uses real local screen URLs that retain filter and page; it intercepts only ordinary same-tab clicks, leaving modifier-click and copied destinations usable. After a page read settles, focus the first new result and announce the page; keep filter focus for filter changes. Hide redundant controls for a single-page result.

`.cu-bar--top` and `.cu-bar--bottom` provide material and edge recipes. The top bar has no upper bright rim; its lower edge retains a 2px highlight and 1px seam. The bottom bar has the 2px highlight and 1px seam at its upper edge. Reduced transparency uses opaque material colors; reduced motion removes decorative movement.

`.cu-action-tray` styles a tray but does not position it. For US-025, mobile's floating tray contains only the Start button, while desktop places Start in the detail action panel. The host owns tray placement, safe-area insets, virtual-keyboard behavior and measured scroll clearance. Make the last content and every focused control reachable above a persistent tray. Do not reuse a demo's fixed offsets or z-index values.

## Shared shell markup and lifecycle API

```js
import {
  headerBar, menuItem, bottomBar, navItem,
  observeNavigationTile, observeCompactNavigation, positionNavigationTile
} from './components.mjs';

const header = headerBar({
  theme: 'light', material: 'glass', menuId: 'workspace-menu',
  brandHref: '/workspace',
  roleLabel: 'Switch to Creator, current Marketer',
  themeAttrs: 'data-action="theme-toggle"',
  roleAttrs: 'data-action="role-switch"',
  menuAttrs: 'data-action="menu-toggle"',
  items: menuItem('Workspace', {href: '/workspace'})
});
const compact = bottomBar(navItem('Jobs', 'jobs', {
  href: '/jobs', active: true, attrs: 'aria-label="My Jobs"'
}));
```

`headerBar` accepts host-controlled navigation markup through `nav`, menu rows through `items`, and static control attributes for host event binding. The default role label is generic; supply the actual role and destination. Use a stable `menuId` when the host handles it; otherwise the helper generates a unique target. `headerControl` is the plain native-button primitive and `menuItem` renders an anchor with `href`, otherwise a button. The host implements actual theme/role/navigation actions and menu dismissal/focus; this renderer never grants permissions or changes routes.

After inserting or replacing the host DOM, bind `observeNavigationTile(desktopNav)` and `observeCompactNavigation(compactNav)`. Each returns a cleanup function; call it when replacing those elements. These observers watch real target/caption dimensions, including late Inter loading. Tile placement uses fractional target geometry and does not animate layout/font corrections. Call `positionNavigationTile(nav, {animate: true})` after an explicit selected-destination change to use the shared motion; reduced motion still wins. Captured viewport width alone is not proof that every caption fits.

Use `.cu-surface` to inherit the shared product font, body size and line height. Opt into `data-density="compact"` for the named 14px baseline profile; generic body guidance stays 16px. Root/text enlargement scales the rem-based measurements. The workbench and US-025 use the compact profile; a future composition can choose comfortable density without copying colors or inventing another theme.

## Shared typography and ready-state content

Inter is the shared font family. Generic body text retains the 1rem/16px guidance; compact product content uses 14px text with 1.55 line-height. Product content headings range from 24px to 30px. Use relative units and allow wrapping instead of fixing content height.

For US-025 details, the Contract panel groups the status badge, agreed price and meaningful actions. Do not repeat the visible status in Ready to start / Work has started headings or explanatory paragraphs. The mobile task tray contains the Start action. Use semantic color only where it communicates a real state.

## Icons and source artwork

`icon(name)` uses a shared 24-unit SVG viewBox, round caps/joins and the canonical outline stroke. The refresh icon is a single clean arc with an arrowhead. `spinner` is a separate smooth 800ms busy mark; under reduced motion it becomes a static visible arc, while the busy label remains present. Icons emitted by the helper are decorative and hidden from assistive technology; the control's text provides its name.

`navItem` uses paired outline/filled glyph paths for the five shared navigation icons. `brand(theme)` and `roleBirds(theme)` use the preserved source SVG artwork from `assets/`; do not redraw or substitute those marks. The `theme` argument selects Light or Dark source artwork.

## Status badges

`badge(label, tone, {icon})` supports `info`, `progress`, `success` and `neutral`. The owning story maps its domain statuses by meaning and supplies the visible label and optional glyph. An informational badge defaults to the generic info icon; US-025 explicitly requests `person-check` for Accepted. The US-025 Accepted/In Progress/Completed/Cancelled mapping is story-specific; a future story must not map every failed or inactive state to Cancelled.

## Review a component in context

Review shared markup and recipes in Light and Dark, then in the actual story composition. Check the element type and accessible name, keyboard focus, hover/pressed/focus separation, status/feedback semantics, long text and enlarged text, narrow and short layouts, reduced motion and reduced transparency. For bars, inspect content behind glass and the opaque fallback. For trays, verify real scroll clearance and safe-area ownership. A local HTML preview demonstrates presentation and mock behavior only; it does not prove product API calls, authorization, persistence or backend integration.


## Manual-review helpers · 1.7.0

- attachmentTag(label) renders a neutral document type separate from an inline link.
- evidenceLink(url) preserves the full HTTP(S) destination and accessible name while wrapping host/path deliberately.
- operationNotice({title,actions}) renders neutral progress with separate controls; these can reopen or stop waiting without replaying a write.
- keepFocusVisible(root) measures actual chrome and scrolls focused content clear of it. The host still owns native dialog focus/dismissal.
- action accepts native button type button, submit or reset; Proof uses submit so native form keyboard submission works.

See the [book](../book/index.html) for parameters, child/parent/page evidence and current human review status.

## Entity headings and measured focus clearance ·1.7

Wrap identity/title in `.cu-status-copy` and use `.cu-status-heading` on its parent, with the lifecycle badge as a sibling. The shared grid owns the upper-right slot; narrow enlarged content places the complete identity beneath a right-aligned badge. Do not restore story flex overrides or absolute positioning. Attachment labels and checklist cues keep their semantic role.

`keepFocusVisible` measures the actual header, bottom navigation and task tray and scrolls the control into the available band. Test actual Tab navigation at short enlarged sizes; native scroll-into-view centering can double-count enlarged scroll padding. Dialog scrolling remains separately managed.

Native supported select menus use faint option dividers and inset arrows. Native fallback retains platform semantics; unsupported browser-specific menu appearance is not claimed.
