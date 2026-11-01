# US-025 studio

From the handoff root run `node serve.mjs --port 4188`, then open [index.html](index.html) through that server. [screen.html](screen.html) opens the product preview without author controls.

Choose one of the 41 named states, Light/Dark, viewport/text size, standard/long content and motion/transparency fallbacks. Configure mock outcomes or hold a response for inspection; the author controls resolve pending samples without putting fixture controls in product UI. Scenario selection resets a local snapshot and does not dispatch a mutation.

Operate the screen to follow real demo transitions. Pending Start is single-submit, can be dismissed/reopened and retains its operation; timeout enters uncertainty and requires a status read before retry. Local reload/back navigation can preserve uncertainty without replaying write intent.

The model lives in [../model/scenarios.json](../model/scenarios.json); regenerate with `node US-025/demo/build.mjs` from the handoff root. Run `node check-handoff.mjs` for source and behavior checks. See [story requirements](../README.md), [principles](../../book/PRINCIPLES.md) and [export boundaries](../../EXPORT.md). Fixtures are design simulations; API permissions and persistence are separate implementation work.
