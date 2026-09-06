# Frontend CI quality gate

This repository uses two GitHub Actions workflows with deliberately different purposes:

- **Frontend CI** is the automatic merge quality gate for pull requests into `dev` or `main`,
  pushes to those branches, and `v*.*.*` release tags.
- **Frontend extended checks** is a manual and weekly security workflow. It is intentionally not
  part of the merge gate.

Neither workflow checks out, starts, tests, or changes the backend repository or PostgreSQL.

## What the automatic gate checks

The `Frontend CI` workflow runs these jobs in parallel where possible:

| Job                           | Gate                                                                                                |
| ----------------------------- | --------------------------------------------------------------------------------------------------- |
| PR and commit governance      | Conventional Commit PR title and commit messages; structured branch name                            |
| Formatting, lint, and types   | Prettier, GitHub Actions syntax, strict ESLint/Next/SonarJS rules, Next route types, and TypeScript |
| Unit tests and coverage       | The Vitest tests that exist in this repository and the initial 10% global coverage floor            |
| Dependency vulnerability gate | Blocking High/Critical lockfile audit; optional GitHub PR dependency-diff review                    |
| Secret scan                   | Gitleaks scan of Git history                                                                        |
| Production build              | A strict `next build`, with pnpm-store and `.next/cache` reuse                                      |

The last job is named **Frontend quality gate**. It succeeds only when every job in the table
succeeds.

The `pnpm audit` portion of the dependency gate always runs and remains blocking. GitHub's separate
Dependency Review action requires the repository Dependency Graph, so it runs only when the
repository Actions variable `DEPENDENCY_REVIEW_ENABLED` is exactly `true`. This prevents a missing
GitHub repository feature from blocking a PR while keeping the lockfile vulnerability gate active.

The test job does not translate backlog rows into tests and does not assume that Epics 2–4 are
implemented. It runs only committed `*.test.ts` and `*.test.tsx` files. The initial tests cover
pure Epic 1 validation and API-envelope behavior already present in the frontend. Async Server
Components and real authentication journeys need an eventual browser/full-stack suite; they are
not part of this gate today.

Coverage currently includes reusable code under `src/components`, `src/features`, and `src/lib`,
while generated API types and type-only files are excluded. The 10% floor is intentionally modest
for the current partial implementation. Raise it as tested behavior grows; do not add tests for
unfinished stories merely to satisfy the percentage.

## Configure the branch rule

A workflow does not block a merge by itself. GitHub blocks a merge only when a branch rule or
ruleset names a workflow job as a required status check.

For `main` (and optionally `dev`):

1. Open **Settings → Rules → Rulesets** in GitHub.
2. Create or edit the branch ruleset and require pull requests.
3. Enable required status checks.
4. Select only **Frontend quality gate** as the required CI check. It appears inside the
   **Frontend CI** workflow run.
5. After the first successful run, enable “require branches to be up to date” if the team wants
   every PR retested against the latest target branch.

Do not select the individual jobs and do not select anything from **Frontend extended checks**.
The single aggregate status keeps the rule stable if the internal job layout changes. If the team
wants observation without blocking while the workflow settles, leave the required-check list empty
for the first few pull requests, then add the aggregate check after it is consistently green.

To enable the stricter PR dependency-diff review later:

1. Open **Settings → Advanced Security** and enable the repository Dependency Graph.
2. Open **Settings → Secrets and variables → Actions → Variables**.
3. Add the repository variable `DEPENDENCY_REVIEW_ENABLED` with the value `true`.

Until both are configured, the workflow records a notice and relies on the blocking High/Critical
`pnpm audit` result.

## Pull request conventions

PR titles and commits use Conventional Commits:

```text
feat(auth): add registration validation
fix(profile): preserve an empty LINE ID
test(auth): cover invalid login input
ci: add frontend quality gate
```

PR branches use `<type>/<description>`. Accepted prefixes include `feat`, `feature`, `fix`,
`bugfix`, `hotfix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`,
`release`, `epic`, `story`, and `task`. Dependabot, Renovate, and GitHub-generated revert branches
are also accepted, as are `codex/*` and `copilot/*` automation branches. The long-lived `dev` and
`main` branches are exempt so a `dev` → `main` promotion PR remains valid.

Examples:

```text
feat/US-001-registration
fix/login-error-message
docs/ci-setup
```

Only commits introduced by the current PR or push are linted. The exact legacy commit
`f4c1338568147ffb61a517fa3f4933a0c6f1281e` (`Add AGENTS.md`) is skipped because it predates the
policy but is still in the current `dev` → `main` promotion range. New commits and PR titles do not
receive that exception.

## Selectable, non-blocking checks

Open **Actions → Frontend extended checks → Run workflow** and choose one of:

- `codeql` for JavaScript/TypeScript SAST;
- `dependency-audit` for a stricter Moderate-and-above dependency audit;
- `secret-history` for an explicit full-history Gitleaks pass; or
- `all` for every extended check.

The workflow also runs `all` every Monday at 08:00 Asia/Bangkok time. Because it has no
`pull_request` trigger and is not included in **Frontend quality gate**, it cannot block ordinary
merges unless somebody explicitly adds one of its jobs to the branch ruleset.

## Local commands

Use Node.js 24 and the package-manager version pinned in `package.json`:

```powershell
corepack enable
pnpm install --frozen-lockfile
pnpm check
```

Useful narrower commands are `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`,
`pnpm test:coverage`, and `pnpm build`.

## Builds, tags, and deployment

Every PR gets a production build check without needing the backend. Protected pages are dynamic,
so backend requests happen at request time rather than during `next build`.

Pushes to `main` and `v*.*.*` tags additionally upload the verified Next build output for seven
days. This is build evidence, not an automatic deployment. There is intentionally no staging or
production deployment and therefore no fake rollback job. Add deployment only after the team has
chosen a host, environment variables, health checks, migration ownership, and an actual rollback
mechanism.

A future end-to-end workflow should live separately, pin both repository revisions, start
PostgreSQL and the Go API, apply migrations, wait for `/readyz`, start this frontend, and then run a
small Playwright suite. Keep that workflow non-required until those cross-repository contracts are
stable.
