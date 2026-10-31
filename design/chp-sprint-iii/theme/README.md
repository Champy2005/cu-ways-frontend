# CU Ways shared theme

**Rose × Slate 1.9.0 hierarchy and canonical lifecycle · 31 October 2026.** This package records the selected Round 10 appearance and inspected frontend alignment with later user corrections. Read the [latest Round 10 direction notes](../US-025/color-playground/ROUND-10.md) when intermediate screenshots disagree. [The review record](../REVIEW.md) separates the current feedback revision status from retained baseline coverage. Future material changes still require fresh review. Round 10 remains a comparison input and must not be dismissed as historical. Figma/SVG remain read-only unless the user explicitly authorizes edits. This package does not implement application migration. Open the [workspace handoff](../index.html), the [interactive theme lab](lab.html), or the [US-025 HTML story demo](../US-025/demo/index.html).

Read the generated [theme reference](REFERENCE.md) for current resolved values, status and recorded preferences. Use the [component guide](COMPONENTS.md) for shared markup and behavior, the [parameter guide](PARAMETERS.md) for units and derived effects, [specialization rules](SPECIALIZATION.md) for inheritance and local aliases, and the [adoption handoff](ADOPTION.md) for application integration boundaries.

## Sources and ownership

| Source | Owns | Editing rule |
| --- | --- | --- |
| [theme.json](theme.json) | Shared and theme-specific parameters, semantic derivations, preferences, flexible guidance and open decisions | Edit here; version decisions that change shared meaning |
| [components.mjs](components.mjs) | Reusable HTML markup for actions, feedback, status, navigation and source artwork | Change with the component contract; preserve semantic HTML |
| [recipes.css](recipes.css) | Opt-in visual and interaction recipes for shared components | Change with the related source decision; no page layout or route behavior |
| [lab.html](lab.html), lab modules and CSS | Live reference, local tuning drafts and component examples | Preview and proposal surface only; it never writes canonical theme source |
| [ADOPTION.md](ADOPTION.md), [SPECIALIZATION.md](SPECIALIZATION.md) | Integration and inheritance contracts | Keep current with the actual source and decisions |
| `source.mjs`, `tokens.css`, `resolved-tokens.json`, `REFERENCE.md`, `manifest.json` | Generated source projection, CSS, resolved values, reference and package hashes | Regenerate; do not edit as a parallel source |
| Story specialization records | Scoped decisions for one story, feature or page | Inherit this package, name the owner and reason, then bind aliases explicitly in the host |

The theme build resolves token references and opaque sRGB mixes, checks for unknown references and cycles, and emits both Light and Dark exports. CSS is opt-in through `data-cu-theme="light"` or `data-cu-theme="dark"`. Import generated `tokens.css` before `recipes.css` inside an approved implementation scope. The package does not set global page styles, routes, shell state or a system theme preference; the host owns those decisions.

## Current interaction decisions

This alignment retains the selected status/action colors and accepted material/effect choices. The shared header, attached menu and bottom-navigation markup/recipes are used by the lab and story demo. The header has a 72px reference height and plain controls with minimum 44px targets; the logo targets 124px on mobile and 152px on desktop, with 51px role-bird artwork. If enlarged text needs more room, the header may grow or reflow rather than clip content. The plain menu attaches directly below the header and uses divided 48px minimum-height rows that may grow for wrapped/enlarged text. The upper header has no bright top rim; its lower edge keeps a 2px highlight and separate 1px seam. The bottom bar keeps the same 2px upper highlight and 1px seam. Header materials use the source's theme-specific transparency and blur settings; reduced-transparency mode falls back to opaque source colors.

Use Inter as the shared family. Generic body text keeps the 1rem/16px guidance; compact product content inherits text.compactBody (.9375rem before viewport/text scaling) and the shared line-height. Product content headings range from 24px to 30px and remain responsive. Mobile bottom navigation uses the short Home, Jobs and Invites labels at an 11px caption size with 14px line-height and a filled selected icon without a tile/frame/marker; the 64px destination target remains. Desktop navigation shows full labels horizontally at 14px and retains its moving selection tile. Keyboard focus is independent from selection. The design sizes components, not fixed page coordinates.

Feedback banners contain message content only. In both themes, error title and body use neutral body text, the error icon and 5px inline-start rail carry the red signal, and a neutral outer border remains around the canonical opaque error fill. Use `feedbackBlock` for related recovery controls in an adjacent, unpainted action group; primary task commands remain in their own task context. Every message shape uses one icon/copy grid. Warning now has a defined muted amber signal on Slate fill with neutral copy and border; see the component and parameter guides.

Use one return action for a route/state. A normal detail page has one raw muted top Back link; do not repeat it inside a card. A card may contain a contextual navigation link only when the page has no equivalent return link. Navigation uses anchors; operations use buttons. List pagination is compact arrow navigation with full accessible names such as “Previous page” and “Next page”, plus the current page exposed semantically. Icons share a clean 24-unit outline family with a 1.8 stroke. The refresh glyph is an arrow on a single clean arc. The busy spinner uses one smooth 800ms turn; reduced motion stops its movement while leaving a static arc and visible busy label.

On mobile, a floating Start tray contains only the Start button and remains separated from bottom navigation; it has no status-panel heading or explanatory copy. On desktop, Start lives in the detail action panel and does not float. In job detail, show status and agreed price before context fields. The Contract panel contains the status badge, agreed price and actions. Omit descriptions that merely repeat the visible status. The mobile tray contains only Start. Current guidance and evidence live in the [design book](../book/index.html).

Light and Dark shadow alpha varies by action role; the parameter guide explains how the contact and ambient layers are computed. Do not fade the whole action, text, or focus ring. Disabled-state paint remains provisional guidance, not a blanket approved treatment.

## Use and regenerate

From the workspace, run the static HTML handoff with `node "UX UI/serve.mjs"`. The [workflow](../WORKFLOW.md) documents the entry page and portable bundle. In the lab, changes create a validated draft tied to the current theme version and saved only in this browser. JSON export is a proposal; preview CSS is disposable. Promotion requires editing `theme.json`, reviewing both themes and regenerating the exports.

```powershell
node "UX UI/theme/build.mjs"
node "UX UI/theme/build.mjs" --check
node --test "UX UI/theme/build.test.mjs"
```

The CSS variables and `recipes.css` are framework-neutral reference output. An implementation may translate them into existing React/Tailwind/CVA primitives, but it should consume generated token variables instead of retyping values. Choose one reproducible synchronization path; do not leave two manually editable sources.

## Deliberate boundaries

There are no demo viewport coordinates, route inventories, page gutters, card positions, fixed tray offsets, z-index ladders, global font reset, global disabled opacity, redesigned application shell, or invented input/table/chart system. Thin boundaries, optical edges and blur can use CSS pixels; text and content spacing should scale with the type size and actual content. See the parameter guide for units.

The lab and story preview demonstrate reusable markup and appearance. Their layouts are not exportable page templates. US-025's local story model contains fictional fixtures and mock behavior; it does not establish API or persistence behavior. Keep the Round 10 visual material available for comparison and do not treat it as approval of a new render. No application or Figma migration is claimed here. Existing Figma/SVG artifacts remain unedited unless explicitly reauthorized.

## Maintaining the system

1. Edit the canonical parameter or record a scoped specialization; avoid anonymous CSS literals.
2. Update the related component recipe, preference or decision rationale.
3. Regenerate and check the package. Validate the actual adopting composition and accessibility in both themes, then obtain a fresh, unbiased review of the rendered result before promoting a visual decision. The root should reject reviewer findings only with direct evidence.
4. Promote a repeated, useful specialization through a versioned shared decision, then remove duplicate local aliases.

Use patch versions for corrections that preserve intent, minor versions for additive parameters or recipes and major versions for renamed/removed semantics or broad visual changes. This is an internal convention, not a public design-system standard.
