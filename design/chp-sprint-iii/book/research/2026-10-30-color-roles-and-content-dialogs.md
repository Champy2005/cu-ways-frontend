# Color roles and content dialogs · 1.8 proposal

The latest human feedback controls the result. These references guide roles and implementation; they do not certify the chosen colors or supersede human judgment.

- [Radix scale usage](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale): distinguish canvas, component, hover, boundary, solid and text roles. Apply separate foreground/background values rather than coloring an entire component with one accent.
- [Radix palette composition](https://www.radix-ui.com/colors/docs/palette-composition/composing-a-palette): a neutral foundation can support several semantic scales; heavily tinted dark neutrals can clash with colorful components. Preserve the established dark canvas/card family while adding role-specific accent pairs. Custom colors here are a local proposal, not untouched Radix scales.
- [Atlassian color](https://atlassian.design/foundations/color): use semantic tokens and separate light/dark neutrals; hue conveys meaning while most structural surfaces stay neutral.
- [Carbon notifications](https://www.carbondesignsystem.com/building-blocks/core/components/notification/guidelines): choose disruption and status to suit the message. Separate actionable recovery controls from message text; review them as a group.

Local role proposal: rose main commitment, blue secondary navigation/recovery, neutral utility/dismissal, violet progress and supporting informational tones, teal success, amber caution, coral error/destruction. Third/fourth accents describe roles, not permission to add decorative colors everywhere. No rainbow series or gradient wash. Message outer boundaries are restrained; the icon carries a stronger signal and copy stays neutral. Quiet tertiary commands and pagination are transparent at rest. Inputs retain explicit boundaries and keyboard focus remains visible.

Content-origin dialogs share one dimmed/blurred backdrop with reduced-transparency fallback and borderless close atom. Layout menus remain attached with no modal scrim. Drafts are retained on close; already dispatched writes keep their operation state and are reconciled on bounded timeout. Initial loading uses destination-specific panel scaffolds, not invented placeholder facts.

US034 public job-reference decision: backend GET /api/v1/jobs/{id} requires active Creator membership and ownership (OpenAPI and JobService.GetJob inspected read-only). Current frontend review type/card exposes no public job destination. The prior demo dialog invented a destination; this iteration keeps Job # as quiet provenance text. Future participant navigation requires a real authorization-capable route/contract.

Reversibility: the original 1.7.0 and exhaustive archives remain unchanged. `theme/history/1.7.0.json` is the exact previous canonical theme for the palette comparison page; the workspace iteration4 before/ manifest preserves editable source. Current values are canonical proposed defaults, with human palette acceptance pending.
