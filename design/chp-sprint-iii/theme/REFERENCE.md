# Generated theme reference

Source: theme.json · 1.9.1. Edit the source and regenerate. Status: approved = adopted visual default; guidance = adaptable starting point; provisional = needs design/validation.

| Token | Light | Dark | Status | Description |
| --- | --- | --- | --- | --- |
| rim.highlight | 2px | 2px | approved | Shared rim / highlight parameter. Inherit unless a scoped, documented specialization is needed; this is not a page coordinate. |
| rim.seam | 1px | 1px | approved | Shared rim / seam parameter. Inherit unless a scoped, documented specialization is needed; this is not a page coordinate. |
| border.hairline | 1px | 1px | approved | Shared border / hairline parameter. Inherit unless a scoped, documented specialization is needed; this is not a page coordinate. |
| radius.headerLower | 10px | 10px | approved | Shared radius / headerLower parameter. Inherit unless a scoped, documented specialization is needed; this is not a page coordinate. |
| radius.bottomUpper | 12px | 12px | approved | Shared radius / bottomUpper parameter. Inherit unless a scoped, documented specialization is needed; this is not a page coordinate. |
| radius.actionTray | 16px | 16px | approved | Shared radius / actionTray parameter. Inherit unless a scoped, documented specialization is needed; this is not a page coordinate. |
| radius.action | .625rem | .625rem | guidance | Scales with text/root size; validate intrinsic sizing and zoom. |
| radius.card | .75rem | .75rem | guidance | Scales with text/root size; validate intrinsic sizing and zoom. |
| radius.status | .25em | .25em | guidance | Scales with text/root size; validate intrinsic sizing and zoom. |
| size.targetMin | 2.75rem | 2.75rem | guidance | Scales with text/root size; validate intrinsic sizing and zoom. |
| size.actionMin | 3rem | 3rem | guidance | Scales with text/root size; validate intrinsic sizing and zoom. |
| size.navRowMin | 4rem | 4rem | guidance | Scales with text/root size; validate intrinsic sizing and zoom. |
| size.navIconSlot | 1.375rem | 1.375rem | guidance | Scales with text/root size; validate intrinsic sizing and zoom. |
| space.actionInline | 1.125em | 1.125em | guidance | Scales with text/root size; validate intrinsic sizing and zoom. |
| space.actionBlock | .65em | .65em | guidance | Scales with text/root size; validate intrinsic sizing and zoom. |
| space.iconGap | .5em | .5em | guidance | Scales with text/root size; validate intrinsic sizing and zoom. |
| space.navIconLabelGap | .25rem | .25rem | guidance | 4px baseline gap between mobile icon and caption, independent of caption font size. |
| space.trayInset | .75rem | .75rem | guidance | Scales with text/root size; validate intrinsic sizing and zoom. |
| space.trayPadding | .5rem | .5rem | guidance | Scales with text/root size; validate intrinsic sizing and zoom. |
| space.trayGap | .75rem | .75rem | guidance | Scales with text/root size; validate intrinsic sizing and zoom. |
| space.contentClearance | 1.25rem | 1.25rem | guidance | Scales with text/root size; validate intrinsic sizing and zoom. |
| motion.lift | 1px | 1px | approved | Interaction motion lift. Durations are milliseconds; reduced motion removes decorative movement. |
| focus.width | 3px | 3px | guidance | Shared focus / width parameter. Inherit unless a scoped, documented specialization is needed; this is not a page coordinate. |
| focus.offset | 3px | 3px | guidance | Shared focus / offset parameter. Inherit unless a scoped, documented specialization is needed; this is not a page coordinate. |
| motion.action.duration | 150 | 150 | approved | Interaction motion action.duration. Durations are milliseconds; reduced motion removes decorative movement. |
| motion.navigation.duration | 240 | 240 | approved | Interaction motion navigation.duration. Durations are milliseconds; reduced motion removes decorative movement. |
| motion.feedback.duration | 140 | 140 | approved | Interaction motion feedback.duration. Durations are milliseconds; reduced motion removes decorative movement. |
| text.body | 1rem | 1rem | guidance | Shared text / body parameter. Inherit unless a scoped, documented specialization is needed; this is not a page coordinate. |
| text.caption | .875rem | .875rem | guidance | Shared text / caption parameter. Inherit unless a scoped, documented specialization is needed; this is not a page coordinate. |
| text.back | 1rem | 1rem | guidance | Shared text / back parameter. Inherit unless a scoped, documented specialization is needed; this is not a page coordinate. |
| text.lineBody | 1.55 | 1.55 | guidance | Shared text / lineBody parameter. Inherit unless a scoped, documented specialization is needed; this is not a page coordinate. |
| text.lineLabel | 1.25 | 1.25 | guidance | Shared text / lineLabel parameter. Inherit unless a scoped, documented specialization is needed; this is not a page coordinate. |
| text.weight.action | 600 | 600 | approved | Shared text / weight / action parameter. Inherit unless a scoped, documented specialization is needed; this is not a page coordinate. |
| text.weight.back | 400 | 400 | approved | Shared text / weight / back parameter. Inherit unless a scoped, documented specialization is needed; this is not a page coordinate. |
| text.weight.navRest | 600 | 600 | approved | Shared text / weight / navRest parameter. Inherit unless a scoped, documented specialization is needed; this is not a page coordinate. |
| text.weight.navSelectedMobile | 700 | 700 | approved | Shared text / weight / navSelectedMobile parameter. Inherit unless a scoped, documented specialization is needed; this is not a page coordinate. |
| text.weight.navDesktop | 600 | 600 | approved | Shared text / weight / navDesktop parameter. Inherit unless a scoped, documented specialization is needed; this is not a page coordinate. |
| motion.navigationEase | cubic-bezier(.22,.8,.25,1) | cubic-bezier(.22,.8,.25,1) | approved | Interaction motion navigationEase. Durations are milliseconds; reduced motion removes decorative movement. |
| opacity.contactFactor | 0.6 | 0.6 | approved | Alpha proportion from 0 to 1 for contactFactor. Apply only to this effect/material layer, not the whole component or its text. |
| color.depth.cool | #B0CFF3 | #B0CFF3 | approved | Tint for cool depth. Pair with the role opacity and shared compact offset/blur; never recolor the entire action. |
| color.depth.darkEdge | #EBF3FF | #EBF3FF | approved | Tint for darkEdge depth. Pair with the role opacity and shared compact offset/blur; never recolor the entire action. |
| color.tint.primaryLight | #FFF0F7 | #FFF0F7 | approved | Semantic tint / primaryLight color. Validate against the actual composed surface, especially glass. |
| color.tint.destructiveLight | #FFE9E9 | #FFE9E9 | approved | Semantic tint / destructiveLight color. Validate against the actual composed surface, especially glass. |
| depth.contactX | 0px | 0px | approved | Shadow/glow geometry: contactX. X/Y are directional offsets; blur is CSS blur radius, with zero spread. Bounded px values are optical details, not page dimensions. |
| depth.contactY | 1px | 1px | approved | Shadow/glow geometry: contactY. X/Y are directional offsets; blur is CSS blur radius, with zero spread. Bounded px values are optical details, not page dimensions. |
| depth.contactBlur | 2px | 2px | approved | Shadow/glow geometry: contactBlur. X/Y are directional offsets; blur is CSS blur radius, with zero spread. Bounded px values are optical details, not page dimensions. |
| depth.ambientX | 0px | 0px | approved | Shadow/glow geometry: ambientX. X/Y are directional offsets; blur is CSS blur radius, with zero spread. Bounded px values are optical details, not page dimensions. |
| depth.ambientY | 3px | 3px | approved | Shadow/glow geometry: ambientY. X/Y are directional offsets; blur is CSS blur radius, with zero spread. Bounded px values are optical details, not page dimensions. |
| depth.ambientBlur | 8px | 8px | approved | Shadow/glow geometry: ambientBlur. X/Y are directional offsets; blur is CSS blur radius, with zero spread. Bounded px values are optical details, not page dimensions. |
| depth.barY | 3px | 3px | approved | Shadow/glow geometry: barY. X/Y are directional offsets; blur is CSS blur radius, with zero spread. Bounded px values are optical details, not page dimensions. |
| depth.barBlur | 14px | 14px | approved | Shadow/glow geometry: barBlur. X/Y are directional offsets; blur is CSS blur radius, with zero spread. Bounded px values are optical details, not page dimensions. |
| depth.menuBlur | 10px | 10px | approved | Shadow/glow geometry: menuBlur. X/Y are directional offsets; blur is CSS blur radius, with zero spread. Bounded px values are optical details, not page dimensions. |
| depth.trayBlur | 12px | 12px | approved | Shadow/glow geometry: trayBlur. X/Y are directional offsets; blur is CSS blur radius, with zero spread. Bounded px values are optical details, not page dimensions. |
| depth.darkInnerEdge | 1px | 1px | approved | Shadow/glow geometry: darkInnerEdge. X/Y are directional offsets; blur is CSS blur radius, with zero spread. Bounded px values are optical details, not page dimensions. |
| radius.navTile | .875rem | .875rem | guidance | Shared radius / navTile parameter. Inherit unless a scoped, documented specialization is needed; this is not a page coordinate. |
| scale.navInactive | 0.9090909090909091 | 0.9090909090909091 | approved | Shared scale / navInactive parameter. Inherit unless a scoped, documented specialization is needed; this is not a page coordinate. |
| scale.navHover | 0.9545454545454546 | 0.9545454545454546 | approved | Shared scale / navHover parameter. Inherit unless a scoped, documented specialization is needed; this is not a page coordinate. |
| scale.navSelected | 1 | 1 | approved | Shared scale / navSelected parameter. Inherit unless a scoped, documented specialization is needed; this is not a page coordinate. |
| stroke.navRest | 1.8 | 1.8 | approved | Shared stroke / navRest parameter. Inherit unless a scoped, documented specialization is needed; this is not a page coordinate. |
| stroke.navHover | 2.1 | 2.1 | approved | Shared stroke / navHover parameter. Inherit unless a scoped, documented specialization is needed; this is not a page coordinate. |
| color.error.charcoal | #242426 | #242426 | approved | Feedback charcoal paint. Neutral ink/border are separate from the red signal; banners never contain actions. |
| color.error.redWash | #923333 | #923333 | approved | Feedback redWash paint. Neutral ink/border are separate from the red signal; banners never contain actions. |
| weight.error.redWash | 0.25 | 0.25 | approved | Opaque sRGB mix proportion (0–1) for error / redWash. Derived fill/border colors are recomputed from the source; this is not element opacity. |
| text.navSelectedOpticalStrength | .2px | .2px | approved | Shared text / navSelectedOpticalStrength parameter. Inherit unless a scoped, documented specialization is needed; this is not a page coordinate. |
| size.targetFloor | 44px | 44px | guidance | Comfortable minimum target floor; pair with relative growth rather than freezing control height. |
| rim.headerTop | 0px | 0px | approved | No bright rim or reflection on the top edge of the header. The lower header edge remains 2px plus a separate 1px seam. |
| border.bannerRail | 3px | 3px | approved | Feedback accent rail on the inline-start edge. Matches the approved demo; it is a visual signal, never an interactive frame. |
| radius.banner | .625rem | .625rem | guidance | Feedback corner radius; adapt to component scale without making the banner look like a button. |
| space.bannerPadding | .875em | .875em | guidance | Internal padding for feedback text and icon, scaling with text rather than viewport width. |
| size.inlineIcon | 1.125em | 1.125em | guidance | Decorative action/feedback icon size relative to its visible label. |
| stroke.icon | 1.8 | 1.8 | guidance | Round-cap SVG stroke at a 24-unit viewBox. Use one outline family, including the refresh arrow. |
| motion.spinnerDuration | 800 | 800 | guidance | One smooth spinner revolution in milliseconds; reduced motion shows a static arc and keeps its visible busy label. |
| blur.header | 18px | 24px | approved | Backdrop blur for header. It blurs content behind the material, not the text/icons; reduced transparency uses an opaque fallback. |
| blur.bottom | 18px | 24px | approved | Bottom glass backdrop blur inherits the theme header blur: Light18px, Dark24px. Reduced transparency uses opaque material without filtering. |
| font.family | Inter, system-ui, sans-serif | Inter, system-ui, sans-serif | guidance | Shared product UI font. Locally bundled Inter 400/600/700; application adoption still audits existing font ownership. |
| text.compactBody | .9375rem | .9375rem | guidance | Compact product density: 14px at the normal 16px root, matching selected Round10. Opt in explicitly; text enlargement still scales it. |
| text.chrome | .875rem | .875rem | guidance | Header/menu and desktop navigation labels: 14px baseline. Independent of compact mobile captions. |
| text.navCaption | .6875rem | .6875rem | guidance | Short mobile destination captions: 11px baseline; keep full accessible names and scale with root/text enlargement. |
| text.navLine | .875rem | .875rem | guidance | Mobile caption line box: 14px baseline, paired with the 22px icon slot and 4px gap. |
| size.headerMin | 4.5rem | 4.5rem | guidance | 72px baseline header. This is a minimum, not a fixed height; wrap utilities when text enlargement requires it. |
| size.headerIcon | 1.5rem | 1.5rem | guidance | 24px outline header utilities; preserve the independent 44px minimum target. |
| size.brandCompact | 7.75rem | 7.75rem | guidance | 124px compact logo width; retain source aspect ratio rather than shrinking the bird/logo to fit arbitrary cells. |
| size.brandWide | 9.5rem | 9.5rem | guidance | 152px wide-header logo width; host chooses compact presentation when navigation no longer fits. |
| size.roleArtwork | 3.1875rem | 3.1875rem | guidance | 51px source bird artwork width, preserving its full paired-bird silhouette. |
| size.roleTarget | 3.25rem | 3.25rem | guidance | 52px role-switch target width at normal root size; never substitute a tiny inline icon. |
| space.headerInline | 1rem | 1rem | guidance | Compact header side padding baseline; host may adapt within the 1–2rem range. |
| space.headerBlock | .75rem | .75rem | guidance | Header vertical padding, alongside a growable minimum height. |
| space.headerTools | .25rem | .25rem | guidance | Compact utility gap. Utilities may wrap at enlarged text instead of shrinking source artwork. |
| space.headerToolsWide | .5rem | .5rem | guidance | 8px desktop utility gap from the selected Round10 shell; compact headers retain 4px. |
| size.roleTargetWide | 3.5rem | 3.5rem | guidance | 56px desktop role-switch target around the shared 51px artwork; compact target remains 52px. |
| size.bannerIcon | 1.25em | 1.25em | guidance | Feedback glyph size relative to message text. The same column is reserved for titled and body-only messages; do not scale by viewport width. |
| space.bannerCopyGap | .3em | .3em | guidance | Gap between a feedback title and its explanatory copy; omitted naturally when either is absent. |
| space.feedbackGap | 1em | 1em | guidance | Clear unpainted separation between a message-only banner and its associated recovery controls. Controls remain outside the banner/live region. |
| scale.viewport.desktop | 1.0625 | 1.0625 | guidance | Bounded viewport scale at the documented desktop breakpoint; multiply explicit text enlargement rather than replacing it. |
| scale.viewport.wide | 1.125 | 1.125 | guidance | Bounded viewport scale at the documented desktop breakpoint; multiply explicit text enlargement rather than replacing it. |
| scale.viewport.large | 1.25 | 1.25 | guidance | Bounded viewport scale at the documented desktop breakpoint; multiply explicit text enlargement rather than replacing it. |
| scale.viewport.ultra | 1.375 | 1.375 | guidance | Bounded viewport scale at the documented desktop breakpoint; multiply explicit text enlargement rather than replacing it. |
| blur.dialog | 6px | 6px | provisional | Content modal backdrop only; disabled by reduced-transparency preference. |
| opacity.dialogScrim | 0.46 | 0.46 | provisional | Content modal backdrop alpha; opaque fallback remains legible. |
| layout.workspaceMax | 96rem | 96rem | provisional | Fluid shared workspace outer cap. Content padding remains intrinsic; narrow/mobile widths remain100%. |
| color.surface.canvas | #F3F4F7 | #141519 | approved | Source material for canvas. Glass composites its own alpha over content; opaque fallback uses this exact source color. |
| color.surface.card | #FFFFFF | #202228 | approved | Source material for card. Glass composites its own alpha over content; opaque fallback uses this exact source color. |
| color.surface.header | #EEF2F7 | #1B1E25 | approved | Source material for header. Glass composites its own alpha over content; opaque fallback uses this exact source color. |
| color.surface.bottom | #DFE7F0 | #303945 | approved | Source material for bottom. Glass composites its own alpha over content; opaque fallback uses this exact source color. |
| color.surface.field | #EDEFF4 | #30333B | provisional | Observed supporting surface; input control states have not been designed. |
| color.text.body | #0D111A | #F5F5F5 | approved | Semantic text / body color. Validate against the actual composed surface, especially glass. |
| color.text.muted | #596273 | #BBC0CA | approved | Semantic text / muted color. Validate against the actual composed surface, especially glass. |
| color.border.default | #DCE1E8 | #383E48 | approved | Semantic border / default color. Validate against the actual composed surface, especially glass. |
| color.action.primary.fill | #CB1C66 | #D51B6B | provisional | 1.8 semantic role proposal; inspect composed states in both themes. Human judgment pending. |
| color.action.primary.ink | #FFFFFF | #FFFFFF | approved | Semantic primary / ink paint. Choose the action role explicitly; labels do not determine hierarchy. |
| color.action.destructive.fill | #CF3447 | #C92D49 | approved | Semantic destructive / fill paint. Choose the action role explicitly; labels do not determine hierarchy. |
| color.action.destructive.ink | #FFFFFF | #FFFFFF | approved | Semantic destructive / ink paint. Choose the action role explicitly; labels do not determine hierarchy. |
| color.action.neutralSource | #D9DFE9 | #4D586B | approved | Semantic neutralSource paint. Choose the action role explicitly; labels do not determine hierarchy. |
| color.action.borderSource | #79899F | #9099A7 | approved | Semantic borderSource paint. Choose the action role explicitly; labels do not determine hierarchy. |
| color.action.recoverySource | #D7DEE7 | #3B4A59 | approved | Semantic recoverySource paint. Choose the action role explicitly; labels do not determine hierarchy. |
| color.action.recoveryBorderSource | #8B9DB3 | #8395A7 | approved | Semantic recoveryBorderSource paint. Choose the action role explicitly; labels do not determine hierarchy. |
| color.action.utility.ink | #394454 | #E1E5EC | provisional | 1.8 semantic role proposal; inspect composed states in both themes. Human judgment pending. |
| color.action.recovery.ink | #255D91 | #BDD9F2 | provisional | 1.8 semantic role proposal; inspect composed states in both themes. Human judgment pending. |
| color.nav.selectedInk | #214F7B | #E0F0FF | approved | Semantic nav / selectedInk color. Validate against the actual composed surface, especially glass. |
| color.nav.desktopSource | #BFD3E9 | #43556A | approved | Semantic nav / desktopSource color. Validate against the actual composed surface, especially glass. |
| color.nav.mixBase | #E8ECF2 | #292F39 | approved | Semantic nav / mixBase color. Validate against the actual composed surface, especially glass. |
| color.link.inline | #225F9D | #9EC7F3 | provisional | Ordinary inline link system still needs complete interaction validation. |
| color.status.info.ink | #235D85 | #ACD5F6 | approved | Semantic status / info / ink color. Validate against the actual composed surface, especially glass. |
| color.status.info.fill | #E8F2FA | #213B50 | approved | Semantic status / info / fill color. Validate against the actual composed surface, especially glass. |
| color.status.progress.ink | #24666F | #A3D3DA | provisional | 1.9 correction: purple rejected by human. Slate-blue task actions / muted blue-teal progress, pending human acceptance of replacement. |
| color.status.progress.fill | #E8F3F3 | #233A3E | provisional | 1.9 correction: purple rejected by human. Slate-blue task actions / muted blue-teal progress, pending human acceptance of replacement. |
| color.status.success.ink | #176142 | #A4E4BA | approved | Semantic status / success / ink color. Validate against the actual composed surface, especially glass. |
| color.status.success.fill | #E3F4EB | #203F2E | approved | Semantic status / success / fill color. Validate against the actual composed surface, especially glass. |
| color.status.neutral.ink | #566171 | #C0C8D3 | approved | Semantic status / neutral / ink color. Validate against the actual composed surface, especially glass. |
| color.status.neutral.fill | #E9EDF2 | #333D4B | approved | Semantic status / neutral / fill color. Validate against the actual composed surface, especially glass. |
| color.error.signal | #AE424A | #EBA2AC | provisional | 1.8 semantic role proposal; inspect composed states in both themes. Human judgment pending. |
| color.error.border | #DCE1E8 | #383E48 | approved | Feedback border paint. Neutral ink/border are separate from the red signal; banners never contain actions. |
| color.error.fill | #FCF1F0 | #34262B | provisional | 1.8 semantic role proposal; inspect composed states in both themes. Human judgment pending. |
| color.error.ink | #0D111A | #F5F5F5 | approved | Feedback ink paint. Neutral ink/border are separate from the red signal; banners never contain actions. |
| weight.utility.fill | 0.18 | 0.24 | approved | Opaque sRGB mix proportion (0–1) for utility / fill. Derived fill/border colors are recomputed from the source; this is not element opacity. |
| weight.utility.border | 0.35 | 0.48 | approved | Opaque sRGB mix proportion (0–1) for utility / border. Derived fill/border colors are recomputed from the source; this is not element opacity. |
| weight.entry.fill | 0.25 | 0.32 | approved | Opaque sRGB mix proportion (0–1) for entry / fill. Derived fill/border colors are recomputed from the source; this is not element opacity. |
| weight.entry.border | 0.35 | 0.48 | approved | Opaque sRGB mix proportion (0–1) for entry / border. Derived fill/border colors are recomputed from the source; this is not element opacity. |
| weight.recovery.fill | 0.3 | 0.55 | approved | Opaque sRGB mix proportion (0–1) for recovery / fill. Derived fill/border colors are recomputed from the source; this is not element opacity. |
| weight.recovery.border | 0.55 | 0.45 | approved | Opaque sRGB mix proportion (0–1) for recovery / border. Derived fill/border colors are recomputed from the source; this is not element opacity. |
| weight.tertiary.fill | 0.12 | 0.14 | approved | Opaque sRGB mix proportion (0–1) for tertiary / fill. Derived fill/border colors are recomputed from the source; this is not element opacity. |
| weight.tertiary.border | 0.42 | 0.52 | approved | Opaque sRGB mix proportion (0–1) for tertiary / border. Derived fill/border colors are recomputed from the source; this is not element opacity. |
| weight.nav.desktopFill | 0.5 | 0.55 | approved | Opaque sRGB mix proportion (0–1) for nav / desktopFill. Derived fill/border colors are recomputed from the source; this is not element opacity. |
| color.action.utility.fill | #F8F9FB | #2B2F38 | provisional | 1.8 semantic role proposal; inspect composed states in both themes. Human judgment pending. |
| color.action.utility.border | #C5CCD6 | #606A79 | provisional | 1.8 semantic role proposal; inspect composed states in both themes. Human judgment pending. |
| color.action.entry.fill | #EEF4FB | #26394D | provisional | 1.8 semantic role proposal; inspect composed states in both themes. Human judgment pending. |
| color.action.entry.border | #BACDE0 | #4C6985 | provisional | 1.8 semantic role proposal; inspect composed states in both themes. Human judgment pending. |
| color.action.entry.ink | #255D91 | #BDD9F2 | provisional | 1.8 semantic role proposal; inspect composed states in both themes. Human judgment pending. |
| color.action.recovery.fill | #EEF4FB | #26394D | provisional | 1.8 semantic role proposal; inspect composed states in both themes. Human judgment pending. |
| color.action.recovery.border | #BACDE0 | #4C6985 | provisional | 1.8 semantic role proposal; inspect composed states in both themes. Human judgment pending. |
| color.action.tertiary.fill | #FAFBFC | #262A31 | approved | Semantic tertiary / fill paint. Choose the action role explicitly; labels do not determine hierarchy. |
| color.action.tertiary.border | #C7CDD7 | #5A606A | approved | Semantic tertiary / border paint. Choose the action role explicitly; labels do not determine hierarchy. |
| color.action.tertiary.ink | #515B6B | #C4CAD4 | provisional | 1.8 semantic role proposal; inspect composed states in both themes. Human judgment pending. |
| color.action.recovery.hoverBorder | #7098BD | #80A5C7 | provisional | 1.8 semantic role proposal; inspect composed states in both themes. Human judgment pending. |
| color.action.utility.hoverBorder | #79899F | #9099A7 | approved | Semantic utility / hoverBorder paint. Choose the action role explicitly; labels do not determine hierarchy. |
| color.action.entry.hoverBorder | #7098BD | #80A5C7 | provisional | 1.8 semantic role proposal; inspect composed states in both themes. Human judgment pending. |
| color.action.tertiary.hoverFill | #EDEFF3 | #343943 | provisional | 1.8 semantic role proposal; inspect composed states in both themes. Human judgment pending. |
| color.action.tertiary.hoverBorder | #D9DDE4 | #535E6D | provisional | 1.8 semantic role proposal; inspect composed states in both themes. Human judgment pending. |
| color.nav.desktopFill | #D4E0EE | #374454 | approved | Semantic nav / desktopFill color. Validate against the actual composed surface, especially glass. |
| color.nav.hoverFill | #DBE4EF | #323C4A | approved | Semantic nav / hoverFill color. Validate against the actual composed surface, especially glass. |
| color.nav.hoverBorder | #BCC9D8 | #515965 | approved | Semantic nav / hoverBorder color. Validate against the actual composed surface, especially glass. |
| opacity.chrome.header | 0.92 | 0.65 | approved | Alpha proportion from 0 to 1 for chrome / header. Apply only to this effect/material layer, not the whole component or its text. |
| opacity.chrome.bottom | 0.92 | 0.92 | approved | Alpha proportion from 0 to 1 for chrome / bottom. Apply only to this effect/material layer, not the whole component or its text. |
| opacity.chrome.shadow | 0.14 | 0.14 | approved | Alpha proportion from 0 to 1 for chrome / shadow. Apply only to this effect/material layer, not the whole component or its text. |
| color.chrome.shadow | #17283E | #000000 | approved | Semantic chrome / shadow color. Validate against the actual composed surface, especially glass. |
| color.chrome.seam | #405775 | #060C16 | approved | Semantic chrome / seam color. Validate against the actual composed surface, especially glass. |
| opacity.chrome.seam | 0.16 | 0.18 | approved | Alpha proportion from 0 to 1 for chrome / seam. Apply only to this effect/material layer, not the whole component or its text. |
| color.chrome.rim | #FFFFFF | #E0EAF7 | approved | Semantic chrome / rim color. Validate against the actual composed surface, especially glass. |
| opacity.chrome.rim | 0.16 | 0.18 | approved | Alpha proportion from 0 to 1 for chrome / rim. Apply only to this effect/material layer, not the whole component or its text. |
| opacity.chrome.headerRim | 0.9 | 0.18 | approved | Alpha proportion from 0 to 1 for chrome / headerRim. Apply only to this effect/material layer, not the whole component or its text. |
| color.depth.primary | #17283E | #EA86B1 | approved | Tint for primary depth. Pair with the role opacity and shared compact offset/blur; never recolor the entire action. |
| color.depth.destructive | #17283E | #E48B99 | approved | Tint for destructive depth. Pair with the role opacity and shared compact offset/blur; never recolor the entire action. |
| color.depth.secondary | #17283E | #B0CFF3 | approved | Tint for secondary depth. Pair with the role opacity and shared compact offset/blur; never recolor the entire action. |
| opacity.depth.primary | 0.12 | 0.06 | approved | Alpha proportion from 0 to 1 for depth / primary. Apply only to this effect/material layer, not the whole component or its text. |
| opacity.depth.secondary | 0.1 | 0.048 | approved | Alpha proportion from 0 to 1 for depth / secondary. Apply only to this effect/material layer, not the whole component or its text. |
| opacity.depth.utility | 0.06 | 0.039 | approved | Alpha proportion from 0 to 1 for depth / utility. Apply only to this effect/material layer, not the whole component or its text. |
| opacity.depth.tertiaryHover | 0.04 | 0.02 | approved | Alpha proportion from 0 to 1 for depth / tertiaryHover. Apply only to this effect/material layer, not the whole component or its text. |
| opacity.depth.solidHoverBoost | 0.02 | 0.005 | approved | Alpha proportion from 0 to 1 for depth / solidHoverBoost. Apply only to this effect/material layer, not the whole component or its text. |
| opacity.depth.edgePrimary | 0 | 0.03 | approved | Alpha proportion from 0 to 1 for depth / edgePrimary. Apply only to this effect/material layer, not the whole component or its text. |
| opacity.depth.edgeSecondary | 0 | 0.028 | approved | Alpha proportion from 0 to 1 for depth / edgeSecondary. Apply only to this effect/material layer, not the whole component or its text. |
| opacity.depth.edgeUtility | 0 | 0.0265 | approved | Alpha proportion from 0 to 1 for depth / edgeUtility. Apply only to this effect/material layer, not the whole component or its text. |
| color.warning.signal | #946223 | #E0BE80 | provisional | 1.8 semantic role proposal; inspect composed states in both themes. Human judgment pending. |
| color.warning.fill | #FBF5E9 | #302B21 | provisional | 1.8 semantic role proposal; inspect composed states in both themes. Human judgment pending. |
| color.warning.ink | #0D111A | #F5F5F5 | guidance | Neutral readable warning title/body copy, independent of the caution signal. |
| color.warning.border | #DDCEAF | #685738 | provisional | 1.8 semantic role proposal; inspect composed states in both themes. Human judgment pending. |
| color.focus | #306BBA | #8AB4E8 | provisional | Focus ring color for light surfaces; verify against each composed control. |
| color.surface.input | #FAFBFD | #191C22 | guidance | Input well, distinct from the containing card in each theme. |
| color.border.control | #858F9D | #727D8C | guidance | Input and select boundary; stronger than decorative card outlines. |
| color.rating | #93601B | #DDB875 | guidance | Rating stars, distinct from status and action roles. |
| color.feedback.info.fill | #F1F3FA | #272D40 | provisional | 1.8 semantic role proposal; inspect composed states in both themes. Human judgment pending. |
| color.feedback.info.signal | #5368A0 | #B7C4EB | provisional | 1.8 semantic role proposal; inspect composed states in both themes. Human judgment pending. |
| color.feedback.success.fill | #EDF7F2 | #1E302A | provisional | 1.8 semantic role proposal; inspect composed states in both themes. Human judgment pending. |
| color.feedback.success.signal | #267457 | #89CCAE | provisional | 1.8 semantic role proposal; inspect composed states in both themes. Human judgment pending. |
| color.rating.bar | #69798C | #A6B3C3 | provisional | Single neutral review-count series, independent of amber star/status meaning; awaiting human judgment. |
| color.rating.track | #EDEFF4 | #30333B | provisional | Rating-distribution track inherits the quiet field surface. |
| color.feedback.info.border | #CAD3E7 | #4B5677 | provisional | 1.8 semantic role proposal; inspect composed states in both themes. Human judgment pending. |
| color.feedback.success.border | #BBDCCC | #3D6554 | provisional | 1.8 semantic role proposal; inspect composed states in both themes. Human judgment pending. |
| color.action.tonal.ink | #36516E | #CDDBEC | provisional | 1.9 correction: purple rejected by human. Slate-blue task actions / muted blue-teal progress, pending human acceptance of replacement. |
| color.accent.tertiary | #36516E | #CDDBEC | provisional | Reserved supporting accent inherits slate-blue. Rejected purple is not offered by the current lab. |
| color.accent.quaternary | #267457 | #89CCAE | provisional | 1.8 semantic role proposal; inspect composed states in both themes. Human judgment pending. |
| color.overlay.scrim | #182031 | #080B12 | provisional | Content-dialog scrim source; layout-origin menus never use it. |
| color.action.secondary.fill | #315D91 | #A8C7ED | provisional | 1.9 role proposal. Current human judgment pending. Hover changes boundary/ink; quiet controls do not paint a container. |
| color.action.secondary.ink | #FFFFFF | #152941 | provisional | 1.9 role proposal. Current human judgment pending. Hover changes boundary/ink; quiet controls do not paint a container. |
| color.action.secondary.border | #315D91 | #A8C7ED | provisional | 1.9 role proposal. Current human judgment pending. Hover changes boundary/ink; quiet controls do not paint a container. |
| color.action.secondary.hoverBorder | #244A77 | #C4DAF5 | provisional | 1.9 role proposal. Current human judgment pending. Hover changes boundary/ink; quiet controls do not paint a container. |
| color.action.tonal.fill | #EDF2F7 | #2A3543 | provisional | 1.9 correction: purple rejected by human. Slate-blue task actions / muted blue-teal progress, pending human acceptance of replacement. |
| color.action.tonal.border | #BCC9D7 | #63758D | provisional | 1.9 correction: purple rejected by human. Slate-blue task actions / muted blue-teal progress, pending human acceptance of replacement. |
| color.action.tonal.hoverBorder | #879CB3 | #A3B6CE | provisional | 1.9 correction: purple rejected by human. Slate-blue task actions / muted blue-teal progress, pending human acceptance of replacement. |
| color.action.outline.fill | #FFFFFF | #282B33 | provisional | 1.9 role proposal. Current human judgment pending. Hover changes boundary/ink; quiet controls do not paint a container. |
| color.action.outline.ink | #3D495C | #DDE3EC | provisional | 1.9 role proposal. Current human judgment pending. Hover changes boundary/ink; quiet controls do not paint a container. |
| color.action.outline.border | #98A5B7 | #73829A | provisional | 1.9 role proposal. Current human judgment pending. Hover changes boundary/ink; quiet controls do not paint a container. |
| color.action.outline.hoverBorder | #687C98 | #A3B3CA | provisional | 1.9 role proposal. Current human judgment pending. Hover changes boundary/ink; quiet controls do not paint a container. |
| color.action.tool.fill | #F1F3F6 | #303642 | provisional | 1.9 role proposal. Current human judgment pending. Hover changes boundary/ink; quiet controls do not paint a container. |
| color.action.tool.ink | #465267 | #DFE5EF | provisional | 1.9 role proposal. Current human judgment pending. Hover changes boundary/ink; quiet controls do not paint a container. |
| color.action.tool.border | #ABB6C5 | #6A7A92 | provisional | 1.9 role proposal. Current human judgment pending. Hover changes boundary/ink; quiet controls do not paint a container. |
| color.action.tool.hoverBorder | #75869D | #A5B5CA | provisional | 1.9 role proposal. Current human judgment pending. Hover changes boundary/ink; quiet controls do not paint a container. |

## Recorded preferences

- **P01 · Palette** (approved): Rose brand, slate secondary system; distinct canvas, cards, top and bottom chrome. Preserve neutral readable copy.
- **P02 · Action hierarchy** (approved): Three emphasis tiers. Secondary has explicit utility, entry and recovery roles. Intent and wording do not determine emphasis. Destructive is a separate intent.
- **P03 · Light recovery** (approved): Soft neutral slate with a stronger label; recovery must outrank Back navigation. Keep its fill steady on hover.
- **P04 · Back navigation** (approved): Contextual navigation: outside a card/panel, use muted regular plain text, left chevron and underline only on hover/focus, without fill or shadow. Inside a card/panel, use a bounded secondary utility or tertiary button treatment. Preserve anchor semantics for URL navigation.
- **P05 · Depth** (approved): Gentle Light shadows; compact tinted directional depth in Dark. No large surrounding halo or pulsing shine. Stable solid fills, small hover boosts.
- **P06 · Tertiary** (approved): Bounded quiet fill/border and flat at rest; functional tertiary has subtle fine-pointer hover lift/depth. Compact tools remain flat.
- **P07 · Mobile selection** (approved): Filled selected glyph plus stronger caption. No surrounding selection tile, border, underline marker or boxed pointer hover. Keep keyboard focus visible.
- **P08 · Desktop selection** (approved): Keep a moving soft tile. Use the same selected glyph family as mobile. Reserve expansion space; changing selection must not shift neighbors.
- **P09 · Motion** (approved): Calm glide; reduced motion makes state changes instant and removes lifts/nudges. No decorative logo motion.
- **P10 · Header menu** (approved): Compact overlaid dropdown attached below the header. Fill corner gaps, preserve visible header rim/shadow above menu, and do not push the page.
- **P11 · Bar geometry** (approved): Header TOP edge has no bright rim/reflection. Header lower edge and bottom bar upper edge retain the same 2px highlight plus 1px seam in both themes. Top lower corners 10px; bottom upper corners 12px. No gradient band.
- **P12 · Floating action tray** (approved): When a persistent primary is useful, retain the rounded rectangle behind it. Float the entire tray over content, disconnected from bottom navigation. Content scrolls behind; end padding clears it.
- **P13 · Artwork and theme switch** (approved): Preserve CU Ways logos and role-bird artwork. Sun means current Light, moon current Dark; accessible name announces next theme. Do not adopt the rejected role-pill redesign.
- **P14 · Statuses and errors** (approved): Feedback banners contain message content only. Put message-associated Retry/Refresh/Reopen/Check controls in an adjacent, unpainted sibling group via feedbackBlock. Primary domain actions such as Start stay in their action panel/tray; they are not banner controls. All message shapes share an icon column and one copy column. Keep neutral title/body copy and outer borders; semantic signal belongs to the icon/rail and quiet fill.
- **P15 · Layout** (approved): Use intrinsic, responsive composition and relative sizing. Avoid redundant subtitles, give title/filter a coherent group, and choose density from real content. Do not transplant demo positions or gaps.
- **P16 · Accessibility** (required): Preserve focus, text scaling, safe areas, pending/disabled semantics, reduced transparency and reduced motion. Test actual composed surfaces.
- **P17 · Specialization** (approved): Inherit global defaults. A story/page may specialize semantic/component aliases with an explicit scope, reason and evidence; shared changes require a versioned global decision.
- **P18 · Shared icons** (approved): Use one local SVG refresh arrow for read/retry/refresh actions, with a continuous rounded path and visible label. Busy uses a smooth single-arc spinner, never a segmented or recycling-arrow glyph. Decorative icons are aria-hidden. Reduced motion keeps a static arc and busy text.
- **P19 · HTML-first design handoff** (approved): Use runnable local HTML/CSS/JS for current and future story design, parameter tuning, effects, motion and handoff. Global component reference and story demo consume the same canonical package. Figma/SVG exports are historical snapshots; do not update them unless explicitly requested again.
- **P20 · Tuning authority** (required): Live tuning creates a versioned draft proposal, not an automatic canonical edit. Export/import records its base version and scope. Promote reviewed shared changes through theme.json, regenerate, and verify both the component reference and affected story.
- **P21 · Visual fidelity and shared chrome** (required): Use the selected Round10 shell proportions and typography with later user corrections. Header controls and attached menu rows are their own shared chrome primitives, not tiered action buttons. The lab and story must use the same rendered component markup and recipes.
- **P22 · Composition and navigation economy** (required): Choose one return action per destination/state. Do not repeat Back to My Jobs in both page chrome and status cards. Keep mobile pagination to arrows plus a compact page indicator with full accessible names.
- **P23 · Fresh rendered review** (required): Before handoff, ask a fresh unbiased agent to inspect actual rendered screens against the user reference and report visual/interaction concerns. The implementation owner accepts or rejects findings with evidence; passing tests do not substitute for visual review.
- **P24 · Feedback composition** (required): Use the shared message-only banner and structured feedbackBlock for adjacent recovery controls in every current HTML consumer. Warning uses a muted amber icon/rail on Slate fill, distinct from error red and info/success signals. Do not duplicate message copy in the following card or repeat its recovery control elsewhere. Preserve primary domain actions in their owning panel/tray.
- **P25 · Entity status placement** (approved): Lifecycle/status badges anchor at the upper right of the owning entity heading or card. Use intrinsic grid reflow; at narrow enlarged text give the right-aligned badge its own upper row rather than squeezing identity/title. Attachment tags and checklist icons remain their own content types.

## Flexible guidance

- **units:** rem/em for text, targets, icons and spacing; unitless line-height; percentages for weights/alpha. px for thin edges, optical corrections, bounded blur/shadow and explicitly chosen bar corners. Never shrink the root font to preserve screenshots.
- **spacing:** Use a small relative scale; adjacent control gaps about0.4–0.75em, section gaps about1–2rem and page gutters about1–2rem are starting ranges, not constraints. Let content wrap and containers reflow.
- **navigation:** Choose the compact/desktop transition where labels plus utilities fit at enlarged text. Keep hit areas independent of painted selection. Start at3.5–4.5rem nav row; grow for labels/safe area. Reserve icon slot and label metrics; active glyph about1.1 times inactive and hover midpoint about1.05.
- **tray:** Start around0.5–1rem inset/gap; use measured rendered tray height for scroll-end clearance. Content viewport extends behind tray to nav. Avoid fixed bottom math; add safe area once and account for zoom/keyboard/short height.
- **shadows:** Reviewed geometry: contact0 1px2px and ambient0 3px8px, zero spread. Keep decorative depth compact; offset/blur may be optically adjusted for control scale within roughly2–12px, not in proportion to viewport width.
- **caps:** Light default ambient alpha: primary12%, secondary10%, utility6%; preferred ceilings15%,12%,8%. Solid hover increase usually0–2 percentage points. Recalibrate only with evidence.
- **radii:** Preserve approved top10px/bottom12px/action-tray16px references. Adapt control/card radius to size, starting0.625–0.875rem. Avoid giant pill buttons unless the component warrants it.
- **feedback:** Use one icon column and one copy column for title-only, body-only and title/body messages. Keep neutral copy, relative spacing and unpainted adjacent recovery actions. Primary domain controls remain in their task panel/tray. Tone follows the actual state: failure=error, unresolved caution=warning, neutral update=info, confirmed success=success; a lifecycle badge is not a banner.
- **handoff:** Default to one runnable HTML system with global component and story views; local fonts/assets, no network dependency, explicit fixture data and deterministic mock outcomes. Preserve dynamic relative layout and describe unresolved components rather than inventing global page coordinates.
- **rating:** Review-count bars use one restrained neutral series; star symbols remain distinct. Numeric values always remain visible. Avoid warning-like or decorative gradients for counts.

## Open decisions

- Global font-family migration: marketer uses Inter, root uses Geist. No universal font family was approved.
- Forms, input/validation states, tables, charts, tabs, pagination, sidebars, tooltips, toasts, uploads, date pickers and other unshown components need local design and validation.
- Global disabled/busy colors and alpha were not settled; do not adopt demo opacity as a rule. Pending vs disabled semantics must remain distinguishable.
- Route inventory, mobile destination count, More behavior and route matching are product decisions; My Jobs is not automatically added to current frontend routes.
- Breakpoint, bar height, tray eligibility, card density, title scale and page/container widths depend on real content and input behavior.
- Complete dropdown/dialog keyboard and focus management requires implementation validation; demo behavior is not the contract.
- Focus color and field/inline-link tokens are provisional until tested across the actual UI.
- Native-device glass, browser zoom, localization, virtual keyboard and safe-area behavior require real runtime checks.
- Dark/light optical equality is a visual judgment even when geometry is identical; no blanket accessibility certification.
