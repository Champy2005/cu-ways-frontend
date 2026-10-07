# Frontend verification

Use the cheapest check that proves the changed behavior, then run the broader affected gates.
The workspace's `../scripts/verify.mjs` records run-specific evidence and verdicts when both
repositories are available. These repository commands also work independently.

| Layer                     | Command                                  | Evidence and scope                                                                                               |
| ------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Formatting                | `pnpm format:check`                      | Nonmutating Prettier check                                                                                       |
| Static analysis           | `pnpm lint`                              | Zero warnings; existing Next/TypeScript/Sonar rules plus direct client/server import boundary                    |
| Types                     | `pnpm typecheck`                         | Next route generation and strict TypeScript                                                                      |
| Unit/component/regression | `pnpm test:report`                       | Existing `src/**/*.test.{ts,tsx}` suite with JSON/JUnit results                                                  |
| Tooling invariant         | `pnpm test:tooling`                      | Client/server import rule acceptance and rejection cases                                                         |
| Coverage                  | `pnpm test:coverage`                     | Existing global floor; use behavior assertions as the proof                                                      |
| API contract freshness    | `pnpm generate:api:check`                | Regenerates to an owned temporary directory and compares normalized line endings; never rewrites committed types |
| Production build          | `pnpm build`                             | Compilation and server/static route generation                                                                   |
| Real public UI            | `pnpm test:e2e`                          | Chromium desktop/mobile: public navigation, invalid form submission, signed-out route redirects                  |
| Explicit runtime evidence | `pnpm test:e2e:trace --grep public-auth` | Same real UI flow, retaining successful traces as well                                                           |

`generate:api:check` needs the sibling backend OpenAPI specification, or `OPENAPI_SPEC_PATH`
pointing to a pinned local specification. It intentionally fails when committed types are stale;
regenerate and review the contract separately. When `VERIFY_ARTIFACT_DIR` is set, a mismatch
retains `backend.generated.ts` and `backend.committed.ts` in that exact directory and prints both
paths; a missing committed file is recorded with `backend.committed.missing.txt` instead.
The standalone frontend CI cannot assume access
to a second repository and therefore leaves this cross-repository check to the workspace runner.

## Browser setup and ownership

```powershell
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm build
pnpm test:e2e
```

Playwright starts the existing production application on `http://127.0.0.1:3100` and stops
only its own server process. It refuses to reuse an existing process. Set `PLAYWRIGHT_PORT` to
another integer between 1024 and 65535 if that port is occupied. Run one verification at a time
per checkout; builds and runtime checks share `.next`. Each test has a fresh browser context.

The smoke does not call a mock API, enable the fictional marketer demo, inject a session, or
create accounts. It navigates through public links, submits deliberately invalid input, asserts
visible field feedback and no mutations, and visits protected routes while signed out. Those
assertions prove the public frontend paths. Successful login, authorization, backend persistence,
and marketer saves require separately driven real authenticated full-stack checks.

## Evidence

Set `VERIFY_ARTIFACT_DIR` to a fresh absolute directory to retain each run independently:

```powershell
$env:VERIFY_ARTIFACT_DIR = Join-Path $PWD '.artifacts/verification/my-run/unit'
pnpm test:report
$env:VERIFY_ARTIFACT_DIR = Join-Path $PWD '.artifacts/verification/my-run/e2e'
pnpm test:e2e:trace --grep public-auth
Remove-Item Env:VERIFY_ARTIFACT_DIR
```

Without that variable, unit reports use `.artifacts/verification/unit` and browser reports use
`.artifacts/verification/e2e`; repeated runs replace those defaults. Coverage keeps the existing
`coverage/` default, or uses `<VERIFY_ARTIFACT_DIR>/coverage` when the variable is set.

Browser evidence includes `results.json`, `junit.xml`, `html/index.html`, and per-test output
under `test-results/`: final public-state screenshots, diagnostic JSON attachments, failure
screenshots/DOM context, and retained traces. The fixture fails on uncaught browser errors.
Diagnostic JSON records timings, console levels/source locations, HTTP methods/statuses,
normalized route paths, and safe `X-Request-ID` values when returned. It excludes console
arguments, query strings, fragments, unknown route identifiers, headers, and request/response
bodies. Current traces and screenshots contain only public pages and fictional invalid input.
For future authenticated tests, use disposable synthetic accounts: native Playwright traces
capture DOM and network content and are not a general-purpose redaction mechanism.

```powershell
pnpm exec playwright show-report .artifacts/verification/e2e/html
pnpm exec playwright show-trace <path-to-trace.zip>
```

Keep artifacts local and ignored. CI retains browser evidence for 14 days. Do not clean a
directory supplied by a caller: remove only run directories you created after evidence review.

## Verdict and repair

Report exactly one verdict for the requested scope: `VERIFIED`, `NOT VERIFIED`, or
`INCONCLUSIVE`. `INCONCLUSIVE` means required evidence is missing and is not a pass. A passing
build proves compilation, and mocked component tests prove their isolated behavior; neither
proves backend persistence.

Read the concise workspace summary first. Inspect the first meaningful failing gate's report,
trace, or console/network attachment, repair the evidence-supported cause, and rerun that gate
before broader checks. For bug fixes, retain the failing baseline and run the same reproduction
after the repair. Do not weaken assertions, ignore new violations, or fix unrelated quality debt
to make a verification run appear green.

The new ESLint rule checks direct imports/re-exports/static dynamic imports from a `"use client"`
module to known server-only helpers, including relative paths. Type-only imports are allowed.
It does not perform a transitive dependency-graph analysis; the production build provides the
framework's additional boundary validation. Existing Next/TypeScript and complexity rules remain
unchanged.
