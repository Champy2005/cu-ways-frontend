# Chp Sprint III UX/UI handoff ·1.9.1

Standalone runnable reference for US025, US026, US027, US028 and US034 (94 named states). This export adds a more visible shared circular pagination hover to Reviews and My Jobs. It does not change the Next.js app or Tim's previews. Human palette acceptance remains pending.

From the frontend repository:

~~~powershell
node design/chp-sprint-iii/serve.mjs --port 4188
~~~

Open http://127.0.0.1:4188/ . No backend, credentials or build is needed. Ctrl+C stops only this design server.

For source/ownership checks:

~~~powershell
cd design/chp-sprint-iii
node tools/ui/cli.cjs ui:check
node tools/ui/cli.cjs ui:inspect Action
node tools/ui/cli.cjs ui:affected Action
$env:CUWAYS_STORY_ORIGIN = 'http://127.0.0.1:4188'
node tools/ui/cli.cjs ui:validate Action .artifacts/impact.json
node stories/pagination-check.cjs
node book/validate.mjs
~~~

Compiler/browser checks resolve the frontend's existing TypeScript/Playwright dependencies; serving and cached CLI queries need only Node. No dependency installation is part of the export. Paths in older workspace commands prefixed UX UI/ should be made relative to this folder. Generated .artifacts/ files are ignored.

Source entry points: theme/theme.json, theme/components.mjs, theme/recipes.css, US-*/demo/, stories/runtime.mjs. book/INDEX.md and tools/ui/graph.json locate ownership/consumers. book/records/ owns guidance; current close/parent/page captures and inspected comparison sheets are included.

Historical capture images and uncurated raw matrices are kept outside Git in the original workspace archive. Current records retain guidance/history but show only included1.9/1.9.1 evidence; archive-only raw ledger entries are labelled. Historical review text is provenance, not a promise its entire old image matrix is local. Previous full archive SHA256: 461ae803dfe6de7da4f10c084754e1029d1a2f05aadc90fe27bdf135efd3b4b1. Prior archives are unchanged.

See book/reviews/1.9.1/ for focused review/59-check scope and book/reviews/1.9.0/ for the earlier broader review. Local fixtures do not prove real API permissions, concurrency or persistence. Application adoption remains separate.
