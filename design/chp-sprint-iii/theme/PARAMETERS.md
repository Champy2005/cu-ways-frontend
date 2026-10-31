# Theme parameters and derived effects

This guide documents the CU Ways Rose × Slate 1.7.0 manual-review revision. See [the review record](../REVIEW.md) for actual rendered coverage and limits. `theme.json` remains the canonical parameter source for promoted decisions. The guide explains what parameter types mean and how they affect a component; it deliberately does not duplicate the token table: [REFERENCE.md](REFERENCE.md) lists generated Light/Dark values, status and source description. The interactive [theme lab](lab.html) lets you inspect those values and propose browser-local changes.

## Parameter types and units

| Source type | Meaning | How to use it |
| --- | --- | --- |
| `color` | Opaque six-digit sRGB source or a derived color | Use a semantic role such as `surface.card`, `action.recovery.fill` or `error.signal`; validate the final foreground/background combination in both themes. |
| `dimension` | CSS length such as `px`, `rem` or `em` | Use `px` for bounded optical edges and shadow geometry. Use relative text/root units for controls, text, radii and content spacing so they can grow. These are not page coordinates. |
| `number` | Unitless value | It may mean an alpha/mix proportion, a scale factor, a stroke width, or a font weight; use the token description to determine which. |
| `duration` | Milliseconds | Motion duration is expressed in milliseconds and becomes a CSS time value in generated output. |
| `string` | A named choice or CSS timing curve | Treat it as a descriptive value. The current draft editor does not edit string values. |

The generated CSS variable for `color.error.fill` is `--cu-color-error-fill`; dots in a source key become hyphens after the `--cu-` prefix. Use generated variables rather than copying resolved literals into recipes.

## Shared shell measurements and type density

The current comparison target uses a 72px header, plain controls with 44px minimum header-control targets, a 124px mobile logo, a 152px desktop logo and 51px role-bird artwork. These measurements describe shared component geometry, not positions on a page. If zoom or enlarged content needs more room, allow the header to grow or reflow instead of clipping labels or shrinking controls. Wide desktop uses an 8px utility gap and 56px role target; compact headers retain a 4px gap and 52px role target. The attached plain menu has divided 48px minimum-height rows that may grow with wrapping.

Inter is the shared font family. Keep generic body text at the existing 1rem/16px guidance. Product surfaces that need the accepted compact density inherit text.compactBody (.9375rem before viewport/text scaling) and the shared line-height; primary content headings range from 24px to 30px and can scale with available width. Mobile navigation uses short Home, Jobs and Invites labels at 11px with a 14px line-height, a filled selected icon without a tile/frame/marker, and a 64px target. Desktop navigation uses full horizontal labels at 14px and keeps the moving selection tile. Keyboard focus remains independent of selection. Actual caption widths choose balanced rows when enlarged text cannot fit five targets; the column count is component state, not a global page-layout token. Initial and resized desktop selection tiles follow real target geometry after font loading, without animating layout corrections. Prefer relative text units and content-driven layout when expressing these sizes; do not convert them into fixed page positions.

## Opaque mixes and derived colors

A `mix` value combines an opaque foreground color with an opaque background color in sRGB. Its weight is a proportion from 0 through 1: the output channel is `foreground × weight + background × (1 − weight)`, rounded to an integer. The generated result is another opaque color. A 25% mix is not a 25% transparent element.

The theme builder resolves references and mixes when it generates CSS and `resolved-tokens.json`. Dependent colors are therefore the values calculated from the canonical sources at build time. If a source color or weight changes, edit `theme.json` and regenerate; overriding one CSS custom property at runtime does not recalculate its dependent tokens.

## Alpha belongs to a material or effect layer

An `opacity.*` parameter is an alpha proportion for its named layer. Chrome transparency applies to the bar material; depth alpha applies to a shadow. It never means fading the entire control, its icon/text, or its keyboard focus ring. Keep component content fully opaque and apply alpha only to the intended background/effect layer.

Glass blurs content behind a bar, not the bar's text or icons. Header and bottom material values are listed under `opacity.chrome.*` and `blur.*` in [REFERENCE.md](REFERENCE.md); the current source uses 18px header blur in Light and 24px in Dark, with the bottom material inheriting the same per-theme blur. The opaque fallback uses the exact source surface color. Unsupported backdrop filtering and reduced-transparency preference both use that fallback.

## Shadow and rim construction

Action depth uses two layers: a compact contact shadow at 0px x / 1px y / 2px blur, then an ambient shadow at 0px x / 3px y / 8px blur. There is no spread. The contact layer uses 60% of that action role's alpha; the ambient layer uses the full role alpha. The primary, secondary and utility alphas differ between Light and Dark, and destructive primary actions share the primary role. Their canonical values are in the generated reference under `opacity.depth.*` and the corresponding `effect.action.*` entries in generated CSS.

The chrome drop shadow uses the separate 14% chrome-shadow alpha and 0px x / 3px y / 14px blur. The upper header has no bright top-edge rim. Its lower edge retains a 2px highlight and a separate 1px seam. The bottom bar keeps that 2px highlight plus 1px seam on its upper edge. These rim/seam parameters describe component edges only; they do not position a bar on the page.

## Feedback geometry and color

`size.bannerIcon` reserves the same relative icon column for every message shape. `space.iconGap` separates that column from the copy. `space.bannerCopyGap` is the title/body gap; it disappears when either is absent. `space.bannerPadding` scales internal padding with message text, and `space.feedbackGap` leaves a clear, unpainted gap before related recovery controls. The icon centers against the first text line using the shared line height; there are no separate title/body-only offsets. The title is 600 weight and the body 400 at the inherited message size.

`color.error.*` retains neutral ink and border with the selected red signal and fill. `color.warning.*` defines neutral ink/border and a Slate field fill with a muted amber caution signal. Only the icon/rail carry that amber; there is no warm warning wash. Info/success feedback currently inherit their corresponding semantic fill/signal values; badge presentation and domain status mapping remain separate. These are opaque colors, not opacity applied to whole messages or controls. Final foreground/fill and signal/fill combinations must be checked in both themes.

Use `feedbackBlock` to keep action descendants out of the live region and out of the tinted rectangle. A primary task action remains in its task context. For long explanatory copy, a comfortable reading measure is generally around 50–75 characters per line; let the host choose an intrinsic measure rather than declaring a universal page width.

## Motion and accessibility preferences

The refresh glyph is a static 24-unit outline with a 1.8-unit stroke. It is not the busy indicator. Busy uses a smooth, full 800ms spinner turn and keeps its visible label. Under reduced motion, the spinner stops on a static arc and the label remains visible; decorative action/navigation movement also stops or becomes immediate. See `motion.*`, `stroke.icon` and `size.inlineIcon` in the [generated reference](REFERENCE.md).

`approved` marks an adopted reusable default. `guidance` marks a starting value that the owning composition should adapt. `provisional` means the state is not fully designed or validated and must not be presented as approved. For example, disabled paint and field surfaces remain provisional reference guidance.

## Proposing a change in the lab

The lab validates a draft against the exact base theme version and stores it in this browser's local storage. Shared overrides apply to both themes; Light and Dark overrides are theme-specific. The preview recomputes derived colors and effects without changing `theme.json`, `REFERENCE.md` or generated CSS files. A mismatched or invalid saved draft is ignored. Resetting the draft restores the current canonical values in the preview.

JSON and CSS exports are review artifacts. They do not promote a decision or change another user's workspace. To adopt a shared change, review it in both themes and in affected compositions, edit `theme.json`, increment the version according to the internal versioning rules, then regenerate and check the output.

## Second refinement parameters · 1.5.0

`color.surface.input` is the input well, separate from its card. `color.border.control` supplies the stronger boundary for inputs and selects; decorative cards retain `color.border.default`. Both themes are checked for control-boundary contrast. `color.rating` colors review stars and distribution bars without assigning them an action or lifecycle meaning. The theme reference includes the values and per-token descriptions.

Secondary action fill and border weights still mix their source paints with the card surface. The 1.5.0 weights reduce the emphasis of entry and utility actions while preserving a stronger recovery treatment. `radius.action` is now .625rem, within the established control range; shared header, bottom-navigation and tray geometry stays as specified in the reference.

## Manual-review parameters · 1.7.0

The [design book](../book/index.html) reads token definitions directly from theme.json. Back links use1rem. Viewport scale is bounded at1440/1920/2560/3840 CSS pixels and multiplies explicit text enlargement. Feedback has a3px rail and distinct feedback-only info/success tones; warning/error and Dark quiet-action boundaries are provisional pending human judgment.

Shared recipes own the rounded supported native picker, neutral attachment tag, deliberate evidence URL wrapping and dialog/operation primitives. Story layouts own the28rem bounded dialog, intrinsic card/workspace composition, measured navigation clearance and narrow enlarged stacking. The [pending-operation record](../book/index.html#pending-operation) describes the12-second presentation budget and fictional same-tab journal. None of these values authorizes real server rollback or proves application persistence.

## Latest manual-review parameters ·1.7

Lifecycle status uses a two-column intrinsic grid with1rem column/.75rem row gaps. At max30rem and enlarged text, it uses a right-aligned badge row and full-width copy. These values describe composition, not fixed screenshot coordinates.

`color.rating.bar` and `color.rating.track` distinguish count distribution from gold rating stars. The track inherits the field surface. Their values and provisional human color status live in theme.json. Review history uses68ch maximum comment measure; comments over420 source characters use an up-to240-grapheme preview and five-line CSS bound. These review-specific values remain in the story specialization. See the [owning records](../book/index.html#review-comment).
