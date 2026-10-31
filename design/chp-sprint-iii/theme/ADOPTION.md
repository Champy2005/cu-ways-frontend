# Applying the shared theme to the applications

**Status: application adoption pending; local HTML feedback revision reviewed.** This is an implementation handoff, not a claim that either application currently consumes the theme. CU Ways Rose × Slate 1.5.0 is the current HTML feedback revision; the [HTML-first workflow](../WORKFLOW.md), [theme lab](lab.html) and [US-025 story demo](../US-025/demo/index.html) are the interactive design references. Round 10 remains a required visual-comparison input, corrected by later user decisions. The app pointers below are a snapshot of inspected code, not an application redesign or proof that it matches the proposal. Re-read each owning repository's `AGENTS.md` and inspect current code before implementation.

US-025 provides the first interactive story handoff using shared HTML components and theme recipes. It does not migrate the production frontend. Keep the Round 10 visual material available for comparison; Figma/SVG remain read-only unless the user explicitly authorizes edits. US-026 also consumes the shared HTML theme; neither application has adopted it through this handoff.

## Snapshot of candidate integration points

Prepared against frontend `3e8a041ed48bc4d613afe7d6d6e1049a3edb8cde` and backend `439590f8132e8a3f1a47aa4cd4f19aa12214a19a`. Confirm the current state and owning architecture before changing anything.

The inspected marketer frontend is a comparison input, not a pixel-perfect target. It currently uses Inter, a 72px desktop/80px mobile header, a 152px desktop/124px mobile logo, 44px header controls, 44px role-bird artwork, divided 56px menu rows, and mobile navigation captions around 10px with 12px line-height. The 1.5.0 proposal aligns these patterns to a 72px header, 51px birds, plain divided menu rows with a 48px minimum height, 11px/14px short mobile captions and full 14px desktop labels. The logo widths and 44px controls remain aligned. Record these differences so an implementation reviews them deliberately rather than claiming the current app already matches.

| Current owner | Adoption consideration |
| --- | --- |
| `cu-ways-frontend/src/app/globals.css` | Map page, card, text, brand and border variables to canonical exports within a controlled scope. Existing generic shadcn primary is graphite and marketer brand is separate; do not blindly replace token names. |
| `src/components/ui/button.tsx` | Preserve Base UI semantics and CVA composition. Add explicit emphasis, secondary-context and intent variants/aliases only after auditing callers. Current defaults include opacity-based hover and compact sizing; do not infer roles from old classes or labels. |
| `src/components/layout/app-shell.tsx` | Existing shared shell has a separate zinc/white palette and horizontally scrolling nav. Adopt material/selection tokens through its existing component boundary; do not copy a demo shell or replace route ownership. |
| `src/features/marketers/marketer.css` | Consolidate overlapping colors, shadows and navigation styles into one source incrementally. Retain feature-specific content layout. |
| `src/features/marketers/components/marketer-shell.tsx` | Preserve the existing header, compact menu, role picker, skip link and content landmark semantics/focus behavior. |
| Marketer theme provider | Coordinate with the existing localStorage/system theme mechanism, sun/moon control and logos. Avoid two providers or storage keys competing on one page. |
| `src/features/marketers/marketer-navigation.tsx` | Keep route-derived selected state and real `Link` elements. Review paired filled/outline glyphs and measured desktop selection geometry at this boundary. The inspected `ownerViews` has no My Jobs destination. |
| `src/components/layout/navigation-device.ts` | The current shell uses server user-agent presentation selection. A content-fit responsive strategy is a separate implementation change requiring SSR/hydration/resize checks. Presentation mode must never determine permissions. |
| `src/app/layout.tsx`, `(marketer)/layout.tsx` | Root uses Geist and marketer uses Inter. Preserve each typography scope; adopting shared Inter requires an explicit migration review instead of implicitly replacing root Geist. |

Exact logos remain in `public/marketer-assets/logo.svg` and `logo-dark.svg`; retain the source role-bird artwork in `marketer-role-birds.tsx`. Extend the existing icon system with matching selected silhouettes rather than adding an unrelated icon family. Only the demonstrated home/services/jobs/invites/profile family currently has paired selected forms; other glyphs need review.

## Staged integration, if separately assigned

1. Introduce one token adapter and explicit theme root while leaving page composition unchanged. Map existing semantic CSS/Tailwind names by meaning. Start in one representative, reversible scope.
2. Add shared action-role and feedback recipes while retaining native/Base UI semantics. Audit Button consumers across auth, contact settings, invitations, dialogs and destructive controls before changing any default.
3. Consolidate shared chrome, menu material and navigation selection. Route state owns selection; hover never does. Measure the active target for the desktop tile after resize, font, theme and content changes. Keep focus independent of selection and preserve role-specific route sets.
4. Add persistent action trays only to tasks that benefit. The application shell owns safe-area and virtual-keyboard clearance. Ensure the last content and focused controls scroll fully above the tray; do not export demo offsets.
5. Implement story behavior in its own authorized scope. Future stories target theme 1.5.0 and record local aliases only when needed. Review each application adoption against its current source and story requirements. Do not regenerate story screens from the demo's coordinates.

The generated CSS is framework-neutral reference output. An implementation can translate recipes into existing Tailwind/CVA/React primitives, but should consume generated token variables instead of retyping values. Choose one reproducible synchronization path—copy with a freshness check or use the package as a build input—rather than maintaining two editable sources. Add a stale-export check to the adopter's CI only when that connection is implemented.

## Acceptance before application rollout

Run the owning repository's appropriate lint, types, tests and build, plus scoped browser checks. Validate both themes, glass and opaque/reduced-transparency behavior, real header content behind glass, narrow/wide/short layouts, enlarged text and zoom, long/localized labels, keyboard focus and menu dismissal/return, coarse input, reduced motion, route changes, permissions, loading/error/empty/success/pending states, and persistent-action clearance. Check selected, unselected, hover, pressed and focus states separately. Include a fresh, unbiased review of actual rendered pages against the accepted user decisions, Round 10 appearance and inspected frontend. The root adjudicates findings against direct evidence; passing functional tests alone is not visual approval. Verify text and meaningful non-text cues against their composed backgrounds; the opaque demos do not certify every material or component.

No API contract, authorization rule, job lifecycle, route, data or permission change is implied by adopting the visual theme. Keep current integration proof separate from the local HTML demonstration; a story mock cannot establish application behavior or persistence.
