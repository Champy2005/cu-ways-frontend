# Action roles, color and consistency · 31 October 2026

These sources inform the proposal. The human’s current corrections override
reference systems; none of these sources prescribes the exact CU Ways hex values.

| Primary source | Relevant principle | Local decision |
| --- | --- | --- |
| [Carbon button guidelines](https://www.carbondesignsystem.com/building-blocks/core/components/button/guidelines) | Variant weight distinguishes task priority; too many strong actions compete. | Rose commitment, blue useful task, slate-blue supporting task, outlined safe alternative, neutral utility, quiet acknowledgment/return. These are roles, not six colors on every page. |
| [Atlassian color roles](https://atlassian.design/foundations/color) | Semantic tokens communicate intent; neutral and brand roles differ from danger, warning or success. | Keep warning/error/success meaningful. Do not add arbitrary decorative accent hues to banners. |
| [Atlassian accents](https://atlassian.design/foundations/color/accents) | Decorative accents must not impersonate semantic information. | The initially proposed violet is explicitly rejected by the human. Supporting task actions now use slate-blue; In Progress uses muted blue-teal, distinct from completed green. Replacement remains pending human review. |
| [Spectrum button](https://spectrum.adobe.com/page/button/) | Action variants express different visual prominence. | Useful navigation is visibly framed; quiet dismissal uses text-only hover. Safe alternatives have a clear boundary above the final confirmation on narrow screens. |
| [TypeScript compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API) | Programs and type checkers expose symbols, aliases and declarations. | Generate the HTML app’s import/call graph using the existing compiler, with CSS/token edges and explicit runtime unknowns. Do not substitute component-name text searches for resolved calls. |

Light uses dark blue ink or white-on-blue for task actions. Dark uses a pale blue
task action and restrained slate surfaces with readable boundaries. The teal
progress label is a proposal, not human approval. Exact values live only in
`theme/theme.json`; `theme/color-review.html` and the lab render the real shared
recipes. Earlier rejected purple captures stay source-bound and superseded.

Contrast checks inspect opaque text/signal pairs; actual composed pages, hover,
keyboard focus and responsive states receive separate image/interaction review.
No new fade animation or hidden-until-hover control was introduced.
