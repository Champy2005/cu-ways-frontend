# CU Ways shared theme · Rose × Slate 1.9.1

[Live workbench](lab.html) · [Component API](COMPONENTS.md) · [Parameters](PARAMETERS.md) · [Resolved values](REFERENCE.md) · [Adoption](ADOPTION.md) · [Specializations](SPECIALIZATION.md)

Canonical values live in theme.json. Generated source.mjs, tokens.css, resolved-tokens.json, REFERENCE.md and artwork.mjs are included for standalone use. Edit the source, run `node theme/build.mjs`, then `node check-handoff.mjs` from the handoff root.

components.mjs and recipes.css own reusable markup/appearance; stories own content-driven layouts. assets/ contains runtime artwork and local fonts. The workbench can export a browser-local draft, which does not alter the canonical theme.

Current explicit user decisions override older defaults. Selected Round 10 and inspected frontend remain comparison inputs in the original workspace; screenshots and historical theme snapshots are excluded here. Purple was rejected; the replacement slate-blue/blue-teal palette and complete-page acceptance await human judgment. Consult [principles](../book/PRINCIPLES.md) and [decisions](../book/README.md). Functional checks do not grant visual acceptance or prove application integration.
