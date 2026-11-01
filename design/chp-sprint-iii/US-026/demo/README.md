# US-026 studio

From the handoff root run `node serve.mjs --port 4188`, then open [index.html](index.html) through that server. [screen.html](screen.html) opens the product preview alone.

Choose among 14 canonical states, Light/Dark, viewport/text size, standard/long links and motion/transparency fallbacks. Author controls configure save/read outcomes and hold/resolve responses outside the product screen. Operate the form to inspect validation, saved URL/timestamps, status/access changes and uncertain-save recovery.

Initial loading is escapable and distinct from a genuine empty list. A fixture-only Finish loading sample control lives in the studio. Pending writes cannot be duplicated; unknown saves require a read before retry. Long URLs wrap and confirmed saves retain server-timestamp semantics.

The model lives in [../model/scenarios.json](../model/scenarios.json); regenerate with `node US-026/demo/build.mjs` from the handoff root. Run `node check-handoff.mjs` for source and behavior checks. See [requirements and integration](../README.md) and [export boundaries](../../EXPORT.md). Mock outcomes do not prove real API permissions, concurrency or persistence.
