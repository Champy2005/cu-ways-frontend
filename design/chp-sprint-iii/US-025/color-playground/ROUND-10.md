# Round 10 · only the recommended refinements

24 October 2026. [Open selected demo](http://127.0.0.1:4175/US-025/color-playground/round-10.html). The human authorized applying only the three recommendations in the previous response. Round9 and the isolated Gemini study remain available, with independent storage.

1. Mobile active tile: no stroke,5px vertical /2px horizontal inset,8px radius. Edge bars keep the full64px destination target. Selected slate colors and70% Light/Dark strength remain.
2. Flat bounded tertiary: retain existing fill/border, remove shadow/glow and hover lift from tertiary/dismiss/low-priority compact controls. Keep fill/border hover feedback and keyboard focus. Higher-priority resting Dark glow remains unchanged.
3. Connected mobile Start/navigation dock: full width,8px vertical /12px horizontal action padding, shared material,12px upper corners, no gap or shadow at the internal join. Scroll-pane reserve follows the measured action height,64px nav and bottom safe area;20px end padding. Keep the short-height in-flow fallback.

The experiment's berry/teal accents, icon-only selection, role pill, Profile popup, crisp-only Dark depth, single chrome edge and thin scrollbar are not promoted. The original hamburger with10px joined dropdown, role artwork,92/65 glass, chosen chrome depth and higher-priority action semantics remain. This updates the selected demo and handoff rules; application repos, existing SVG exports and Figma are not modified.

## Verification

The generated script passed `node --check`. Browser geometry showed a54px highlight inside a64px target, exactly5px clear above/below and no tile shadow/stroke. Dark primary and utility retained their luminous layers, tertiary computed shadow was `none` and its border remained visible. The original hamburger remained displayed and role border stayed0px.

At320×568 with20px reading text and a20px simulated home area, the action row grew to70.625px. Its observed height was reserved correctly: the scroll pane ended at the dock top, the action bottom met navigation, and there was no horizontal overflow. The final content ended approximately20px above the dock at scroll end. At300px height the action/nav rows remained in flow with zero reserved body margin. A real version10 JSON download contained the three `adoptedRefinements`, flat tertiary rules and measured-dock specification. No browser errors were logged during the check.

Evidence: `round10-verification.json` and `round10-mobile.jpg`. These are standalone design-demo checks, not a full application or native-device verification. Per-theme text colors are unchanged from the selected earlier rounds; arbitrary content behind glass still requires contextual assessment.

Rebuild with `python build-round10.py`. Transfer from version10 `selected-direction` JSON and `../COLOR-AND-ACTION-DIRECTION.md`. The isolated export remains unapproved as a whole.

## Mobile alignment touch-up

The human noted Profile's icon nearly touched the selected tile. The old stretched grid placed the20px icon only1px below the highlight top. Center a compact column instead:20px icon +4px gap +14px label line. This gives8px internal top/bottom clearance within the54px tile while keeping the64px tap target,5px inset, colors and movement. Browser measurement confirmed approximately8px icon clearance; the updated export records the content geometry. See `round10-nav-alignment.json` and `round10-nav-alignment.jpg`.

## My Jobs spacing and highlight width

The next human review requested a quieter/removed subtitle, better desktop title spacing and a slightly narrower mobile selection. Remove the redundant subtitle. Put My Jobs and its Status filter in one desktop header row, bottom-aligned, with24px minimum gap and20px before the list. Retain stacked title/filter below1024px and18px title bottom spacing. Increase horizontal tile inset from2px to4px per side:4px narrower overall, same height, centered content and64px target. Match hover geometry and export the revised dimensions/layout.

Browser inspection confirmed title/filter bottom alignment,20px header-to-list spacing and no subtitle at1440px. At390px the target remained approximately74.8×64px and the tile became66.8×54px. The filter still produced one In Progress row;320px had no horizontal overflow. See `round10-list-desktop.jpg`, `round10-list-mobile.jpg` and `round10-list-layout.json`. Script syntax passed; application source and Figma are unchanged.

## Filled selection icons, visible header seam and quieter glow

Latest24 October feedback supersedes the mobile tile: mobile now uses a22px solid selected icon and stronger caption with no surrounding tile. Desktop keeps its moving tile and uses the same solid silhouettes. All icons reserve22px; inactive outlines render20px. Desktop labels use600 consistently with.2px selected text strengthening; mobile uses600 inactive /700 selected in fixed-width targets. The shared filled family covers Home, Services, Jobs, Invitations and Profile. Focus outlines remain independent of selection.

The open header remains square at its lower corners but now paints at z9 above menu z8. Its paired lower shine/edge and downward shadow remain visible; Light retains the subtle glare gradient. The menu still meets the header exactly, retains10px lower corners and never displaces content.

Dark glow is10% primary/destructive,8% entry/recovery,6.5% utility and0 tertiary, with8px reach. Role factors remain1/.8/.65/0. Halo offsets/spread/rim halve, far blur becomes reach+4, and inner action-edge alpha/solid hover glow boost scale10/18. Light shadows and chrome depth stay unchanged. The once-only saved-choice calibration sets10/8 directly (revision3), preserving subsequent tuning and all other preferences.

Browser checks showed22px solid selected vs20px outline inactive, transparent mobile selection and hidden tile. Desktop positions/widths were identical before/after switching selections. Header/menu edges met exactly, with non-none header shadow and the correct stacking. Computed primary/utility glow layers matched10% /6.5% and8px reach. Reload/export retained10/8; the real JSON download contained the revised navigation, glow and menu rules. Syntax passed and no browser errors were logged. Evidence: `round10-selection-glow.json`, `round10-selection-mobile.jpg`, `round10-selection-desktop.jpg`, `round10-menu-seam.jpg`. The two `round10-review-*.html` files are temporary views of the same implementation with playground controls hidden and isolated storage, used to capture clear568px-high review screenshots. Application repositories, Figma and approved SVG exports remain unchanged.

## Hover continuity and Light/Dark depth parity

Latest24 October feedback replaces the mobile hover frame with stronger icon/ink feedback:21px outline and1px nudge, no pseudo-element/fill/shadow. Clicking settles into22px filled selection. Keyboard focus remains visible. Functional tertiary/dismiss has1px pointer-hover lift and4% Light /2% Dark directional depth, flat at rest. Compact tools remain flat. Reduced motion suppresses lift/nudge; elevation is limited to hover-capable fine pointers.

Dark now follows Light's two-layer shape: `0 1px2px` contact at60% ambient alpha plus `0 3px8px` ambient, without outer rim/spread/far halo. Primary/destructive6%, entry/recovery4.8%, utility3.9%; subtle2-3% inset top light. Solid hover adds0.5 luminous points by default. This supersedes10/8 halo construction; reach remains8px. Revision4 applies6/8 once to older saved choices. This is optical calibration, not proof of identical perception.

Actual pointer checks confirmed Dark tertiary1px lift with2% ambient, Light tertiary1px lift with4% ambient; compact tool shadow remained none. Dark primary6% /utility3.9% matched the directional geometry. Mobile Jobs hover was transparent, shadowless, without `::after`, with21px/-1px icon transform; clicking retained a transparent surface and filled glyph. Syntax, reload and exported rules were checked. Evidence: `round10-hover-depth.json`, `round10-depth-dark.jpg`, `round10-depth-light.jpg`, `round10-mobile-hover.jpg`. Review HTML copies hide controls for screenshots; app/Figma files remain unchanged.

## Top-only slate separation

The user approved changing the top bar to distinguish it from bottom navigation while retaining the slate family. Add `headerChrome`: Light#FAFBFD /Dark#182230. Apply it to the header and attached opaque dropdown only. Retain bottom/dock#DFE7F0 /#222D3D, page#F3F4F7 /#10141D and card#FFFFFF /#1C2430. Existing glass92/65, blur, shadows, edges and all action/navigation-state colors remain. The shared `chrome` token stays available for comparisons and derived state colors; the new header token has its own color editor.

Before/after browser evidence in Light's reduced-transparency fallback showed only header color changing from232/236/242 to250/251/253; page/card/bottom and92% glass setting were identical. Forced-glass Light/Dark views showed the new header sources at92% /65% with original bottom sources at the same opacities. The Dark dropdown matched opaque header24/34/48, met it exactly with no gap, and preserved its shadow. Syntax and the actual JSON export were checked. See `round10-surfaces.json`, `round10-surfaces-light.jpg` and `round10-surfaces-dark.jpg`; review-only HTML copies hide controls and use isolated storage. This is demo/handoff refinement only; Figma and both app repositories remain unchanged.

## Floating Start shelf and stronger Dark navigation separation

Latest24 October feedback supersedes the joined dock. Start floats in an opaque card-surface shelf with16px rounding on all four corners,12px side insets,12px gap above navigation,8px padding and a1px shared border. Navigation retains12px upper corners,64px targets and its safe area. Reserve navigation + safe area +12px gap + measured shelf height; retain20px content-end padding and the short-height in-flow fallback.

Keep the slate family and localize the stronger separation to Dark bottom navigation: `bottomChrome`#304157 at92% quiet-glass opacity. Light remains#DFE7F0. Page#10141D, card#1C2430 and top#182230 remain unchanged in Dark. The attached menu and existing action/icon/hover treatments remain unchanged. Version10 selected-direction export refinement is `2026-10-24-floating-start-and-dark-nav`.

Browser measurements confirmed16px shelf corners,12px side inset/gap, and exact scroll-pane/shelf alignment in Light and Dark. At320×568 with large text and20px safe area, navigation measured84px, shelf74px, no horizontal overflow and approximately19px final-content clearance at scroll end. R12 hides the shelf and reserves only navigation/safe area. At300px height, shelf/navigation are in flow with zero body margin. Dark selected destination opaque contrast is8.95:1. Actual downloaded JSON recorded the updated tokens and shelf rules; script syntax passed. Evidence: `round10-floating-verification.json`, `round10-floating-light.jpg`, `round10-floating-dark.jpg`. Review-only HTML copies hide playground controls and use isolated storage. App repositories, Figma and approved SVG exports remain unchanged.

## True content overlay correction

The human clarified that Start must float on the content itself. Remove the shelf surface, border, padding, shadow and backdrop blur. Keep the button12px inset and12px above navigation. Extend the scroll pane to the navigation top instead of stopping above Start. Move measured button height +12px gap +20px clearance into internal scroll-end padding. The bottom bar colors and short-height in-flow fallback remain unchanged. Latest export refinement: `2026-10-24-true-floating-start`.

Light system fallback and Dark glass both have a transparent, unblurred wrapper. Browser geometry confirms content extends behind Start to the nav top, with12px button/nav gap. At scroll end the final content clears the button by approximately19px. Script syntax passed. Evidence: `round10-true-floating-verification.json`, `round10-true-floating-dark.jpg`. This supersedes the preceding opaque shelf/reserved-height implementation.

## Keep the tray while overlaying content

The human clarified that the rounded rectangle behind Start must remain. Restore the opaque card-surface tray,16px corners,8px padding, shared border and chrome shadow. Preserve the true content overlay from the preceding correction: scroll pane extends to navigation and measured tray clearance is internal end padding. Keep12px side insets/gap. Latest refinement: `2026-10-24-floating-tray-overlay`. This supersedes the preceding transparent-wrapper decision.

## Softer Light recovery tone

Approved recommendation: reduce the icy-blue saturation of Light recovery, lighten/neutralize the fill and strengthen the label. Default resolved colors#E9EDF2 fill,#CBD3DD border,#34465C ink at existing55/45 weights. Add named recovery sources#D7DEE7 and#8B9DB3 for the existing theme editor/export. Preserve shadow/lift and keep hover fill stable, with a stronger neutral border. Dark resolved recovery remains#293B50 /#45586E /#C5D0DF. Latest refinement: `2026-10-24-soft-slate-recovery`. Script syntax passed; browser checks and screenshot are recorded in `round10-soft-recovery-verification.json` and `round10-soft-recovery-light.jpg`.

## Quieter Back navigation

Human review accepted the new Light recovery tone but found Back to My Jobs more prominent. Keep recovery unchanged and reduce Back navigation emphasis consistently: muted neutral ink,400 weight,.9em text and interaction-only1px underline. Retain chevron,44px target, position, text-only hover and visible keyboard focus. Latest refinement: `2026-10-24-quiet-back-navigation`. Browser evidence: `round10-quiet-back-verification.json` and `round10-quiet-back-light.jpg`; script syntax passed.

## Readable Light header shine

Human review found the white shine disappearing into the near-white bar. Preserve its#FAFBFD source and existing14% shadow; add a localized9px lower slate fade (default12.8%) beneath the stronger2px white lip (default72%). Keep1px shaded outer edge. The existing bevel slider drives all three, including zero. Scope is Light header, including attached menu and opaque fallback; Dark and bottom bar remain unchanged. Latest refinement: `2026-10-24-readable-light-header-bevel`. Evidence: `round10-light-header-bevel-verification.json` and `round10-light-header-bevel.jpg`. Script syntax passed.

## Crisp rim replaces the rejected gradient band

Human review rejected the shaded Light header. Remove its9px tint band entirely. Cool the Light header/attached-menu source slightly to#EEF2F7, adding a crisp1px white top reflection and1px white lower inner lip above the1px slate seam. Default white90%, slate16%; the existing bevel control drives both, including zero. Keep14% shadow, menu stacking, corners and Dark/bottom treatments. Latest refinement: `2026-10-24-crisp-light-header`. Evidence: `round10-crisp-header-verification.json` and `round10-crisp-header.jpg`. Script syntax passed.

## Shared midpoint rim thickness

Human review found Dark thicker than Light. The old lower lip was2px in Dark and1px in Light. Use shared1.5px inner highlight plus1px seam (2.5px total), including the header top reflection and closed/open header plus bottom navigation. Colors/alphas and existing shadows remain theme-specific. Latest refinement: `2026-10-24-unified-rim-thickness`. Script syntax passed; browser evidence: `round10-unified-rim-verification.json`. Computed styles confirmed matching1.5px rim/1px seam for both bars in both themes and the open menu. Browser screenshot capture was unavailable; no new image was saved.

## Shared2px rim

Human requested2px instead of1.5px. Set the shared inner rim/header top reflection to2px, retaining1px seam (3px combined edge), theme colors and shadows. Applies to closed/open header and bottom navigation in both themes. Export refinement: `2026-10-24-unified-2px-rim`.
