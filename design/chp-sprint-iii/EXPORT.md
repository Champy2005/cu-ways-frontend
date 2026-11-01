# Run, check and export

From this folder (Node.js 22.13+):

~~~powershell
node serve.mjs --port 4188
~~~

Open <http://127.0.0.1:4188/>. No app dependencies or backend are needed.

In another terminal:

~~~powershell
node check-handoff.mjs
node package-handoff.mjs
~~~

The check validates local HTML/Markdown links, module/asset references, generated theme/scenario modules, the five-story scope, and retained behavior tests using Node's standard library. Source checks do not establish visual acceptance or application integration.

Packaging uses an explicit source selection and writes .artifacts/export/CU-Ways-HTML-Handoff-v1.9.1.zip plus a SHA-256 manifest. Extract the ZIP anywhere and run `node serve.mjs --port 4188` from its root. Output folders, screenshots, logs, old references and diagnostics cannot enter the ZIP. Generated exports are ignored by Git.

Canonical sources: theme/theme.json, theme/components.mjs, theme/recipes.css, each US-*/model/scenarios.json, story screens/state machines, and stories/runtime.mjs. Bundled WOFF2 fonts and SVG artwork are required runtime assets.

After intentional edits regenerate with `node theme/build.mjs`, `node US-025/demo/build.mjs`, `node US-026/demo/build.mjs` and `node stories/build.mjs`, then rerun `node check-handoff.mjs`. See [WORKFLOW.md](WORKFLOW.md). The full workspace capture/review workflow is outside this export; old review results are not presented as current export evidence.
