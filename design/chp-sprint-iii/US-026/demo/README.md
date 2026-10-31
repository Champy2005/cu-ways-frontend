# US-026 interactive HTML handoff

> Current1.7.0 guidance and evidence: [Proof workspace](../../book/index.html#proof-workspace), [pending operations](../../book/index.html#pending-operation) and [page coverage](../../book/index.html#us026-proof). One compact workspace replaces separate form/list cards. Close form/Continue browsing preserves a pending save; timeout or navigation return requires an explicit saved-proof check before retry.

This is the current runnable story handoff for **Proof of delivery**. It reconstructs the 14 canonical states from the local story inventory and decisions, then presents them with the shared CU Ways theme 1.6 components. The old Figma/SVG export and viewer remain read-only provenance in `../design/`; they are not bundled into the portable handoff.

## Run

From the CUWAY workspace root:

```powershell
node "UX UI/serve.mjs" --port 4180
```

Open `http://127.0.0.1:4180/US-026/demo/index.html`. The author page controls story state, fixture content, theme, bar material, viewport, text size, reduced motion/transparency, and deterministic mock outcomes. The product screen runs in a same-origin iframe and validates messages from the author page.

## Story behavior

The model covers A01–A06 for the normal submit and review path, B01–B04 for URL/type/save recovery, and C01–C04 for read failure, status/access changes and loading. The screen accepts full HTTP(S) URLs, supplies the Proof type, shows saved URL/timestamp rows only after a simulated confirmation or successful reconciliation read, and keeps unresolved saves from being retried prematurely. Losing access clears the local job, proof and draft view before returning to My Jobs.

All records, timestamps and outcomes are fictional and held in page memory. The demo issues no fetch/XHR requests to the product, does not exercise authentication or authorization, and proves no API contract, concurrency, or persistence behavior. US026 does not define a production proof-submission endpoint.

## Checks

```powershell
node "UX UI/US-026/demo/build.mjs" --check
node --test "UX UI/US-026/demo/state-machine.test.mjs"
```

The state-machine tests cover all canonical state IDs and key save/reconciliation boundaries. A fresh independent review inspected Light/Dark renders, responsive and focused states, text enlargement, and motion/transparency fallbacks; see [REVIEW.md](REVIEW.md) for its adjudication and proof boundary. Focused browser checks supplement the rendered review. Functional checks alone do not grant visual acceptance, and screen-reader and product integration behavior remain unproven.
