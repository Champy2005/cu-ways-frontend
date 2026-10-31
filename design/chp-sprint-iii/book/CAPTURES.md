# Capture contract

A record's `evidence` array links component, parent and page images. Paths are relative to the book root. Source paths in records are also relative to the book root, not to the JSON file.

Every capture has an ID, file, subject, kind (`component`, `parent`, or `page`), state, theme, viewport, text scale, interaction/material/fallback context, source revision and source hashes. Record the URL plus the actual rendered state when the author studio and iframe URL differ. Capture the component with its full control/focus bounds; do not crop away the defect being judged.

Use `evidence/<revision>/<subject>/<state>-<theme>-<width>-<context>-<kind>.png`. Keep original failures and superseded captures. One page/parent image may serve several records, but every changed component needs its own close inspection. A page screenshot alone does not satisfy a component-spacing review.

At minimum, changed shared patterns need Light/Dark mobile and desktop evidence, plus their relevant hover, keyboard, open dropdown, pending, error, empty, long-content, enlarged-text and short-height states. Scale changes also need the 2560×1347 viewport and a larger-screen check. The record lists what was actually inspected; missing combinations remain unvisited rather than being inferred from a green matrix.

The initial inventory comes from the human's first manual batch. Repeated or older observations are consolidated by owning component and symptom. New captures bind decisions to the current implementation. Human color status remains awaiting review until the human decides.

Each record may declare `evidenceRevision`. It selects the latest scoped gallery without pretending older evidence is a new inspection. Captured-only support is excluded from the default inspected gallery; contact-sheet inspection remains explicitly labelled. Superseded findings remain available under history.

`reviewAssets` preserves supporting inspection sheets or unbound diagnostic images outside certified capture rows; the validator checks these assets and packaging includes them. This field does not imply individual-image inspection or a captured-at-time source hash.
