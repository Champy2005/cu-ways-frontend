# Marketer design assets

These assets come from the provided SE-UX-UI Figma design and local exports.

- `logo.svg`: vector wordmark extracted from the header in the user's local
  `figma/US-008-PerformanceSummaryMarketer.svg`. The original paths and colors are preserved;
  background-colored cutouts are converted into an SVG mask for actual transparency.
- `logo-dark.svg`: the same geometry with light lettering for dark surfaces. No background tile.
- `logo.png`: original raster export, node `134:2987`, retained as a source reference.
- `mascot.svg`: decorative mascot, node `138:9923`.

[Source design](https://www.figma.com/design/XMwuViKKwBvZFBqsVP6PAx/SE-UX-UI?node-id=134-2953)

Profile pictures are represented with the current user's initial until an image data source exists.
The project’s matching Lucide icons supply interface glyphs and faint person/package decorations.

The local `/figma` reference folder is not a runtime dependency. The small production assets above
are self-contained and do not load external resources.
