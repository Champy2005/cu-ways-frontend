# CU Ways · Chp Sprint III UX/UI handoff

Standalone HTML/CSS/JavaScript reference, shared theme **Rose × Slate 1.9.1**. Five studios expose **94 named states** using fictional fixtures. No backend, credentials, dependency installation or app build is needed to view them.

From the frontend repository:

~~~powershell
node design/chp-sprint-iii/serve.mjs --port 4188
~~~

Open <http://127.0.0.1:4188/>. From an extracted export, run `node serve.mjs --port 4188`. Use Node.js 22.13+; Ctrl+C stops the design server.

| Story | Scope | States | Open |
| --- | --- | ---: | --- |
| [US-025](US-025/README.md) | My Jobs, start work, confirmation and recovery | 41 | [Studio](US-025/demo/index.html) · [Screen](US-025/demo/screen.html) |
| [US-026](US-026/README.md) | Proof links, URL/timestamp list and validation | 14 | [Studio](US-026/demo/index.html) · [Screen](US-026/demo/screen.html) |
| [US-027](US-027/README.md) | Completion guards and US031 prerequisites | 14 | [Studio](US-027/demo/index.html) · [Screen](US-027/demo/screen.html) |
| [US-028](US-028/README.md) | Cancellation, Paid/Completed guards and recovery | 15 | [Studio](US-028/demo/index.html) · [Screen](US-028/demo/screen.html) |
| [US-034](US-034/README.md) | Verified reviews, summaries, filters and empty states | 10 | [Studio](US-034/demo/index.html) · [Screen](US-034/demo/screen.html) |

Start with the [theme workbench](theme/lab.html), [component API](theme/COMPONENTS.md), [parameters](theme/PARAMETERS.md), [adoption guidance](theme/ADOPTION.md) and [design decisions](book/README.md). Studios expose Light/Dark, viewport/text sizing, long content, motion/transparency fallbacks, response outcomes and held operations. Author controls sit outside the product screen.

See [EXPORT.md](EXPORT.md) for checks and ZIP packaging, and [WORKFLOW.md](WORKFLOW.md) for source ownership. This export keeps current sources, essential specifications and compact decision records. Screenshots, logs, historical boards/reviews, compiler caches and workspace-only tooling are excluded. The original workspace UX UI folder and its selected references remain separate and unchanged.

Human palette and complete-page acceptance remain pending; unvisited states remain unvisited. This cleanup grants no new visual acceptance. Local fixtures do not prove application API permissions, concurrency or persistence. Frontend adoption requires a separate implementation task and current inspection of both application contracts.
