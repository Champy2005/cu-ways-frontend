# CU Ways Frontend

Next.js App Router frontend for CU Ways. The project uses TypeScript, Tailwind CSS, shadcn/Base UI, and a feature-based architecture.

## Quick start

Requirements: Node.js 22.13.0 or newer (CI uses Node.js 24 LTS) and pnpm 11.25.0.

```powershell
cd path\to\cu-ways-frontend
corepack enable
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The Go backend should be running at `http://localhost:8081`; change `BACKEND_API_URL` in `.env.local` when needed.

## Project structure

```text
src/
├── app/                         # Next.js routes, layouts, loading/error boundaries
│   ├── (public)/                # Landing, login, and register
│   ├── (app)/                   # Authenticated dashboard, profile, surveys, jobs
│   ├── (admin)/admin/           # Administrator-only pages
│   └── api/auth/                # Thin BFF handlers that set/clear session cookie
├── features/                    # Feature API, schemas, types, and feature UI
│   ├── auth/
│   └── users/
├── components/                  # Reusable UI and application shell
│   ├── ui/                      # shadcn/Base UI primitives
│   ├── layout/
│   └── feedback/
├── lib/                         # API clients, auth session, environment, utilities
│   ├── api/
│   └── auth/
├── scripts/generate-api.mjs     # Resolves backend OpenAPI source and generates API types
└── proxy.ts                     # Auth-aware route redirect boundary
```

The `@/*` alias points to `src/*`:

```tsx
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/features/auth/components/login-form";
```

## Authentication flow

Login and registration use the Next.js BFF routes:

```text
Browser → /api/auth/login → Go backend /api/v1/auth/login
                         → HttpOnly cuways_session cookie
```

The browser never reads the JWT. Server API calls read the cookie and forward `Authorization: Bearer ...` to the backend. `src/proxy.ts` performs lightweight redirects, while the backend remains the authority for token validation and permissions.

Try the flow:

1. Open `/register` or `/login`.
2. Sign in with an existing account, or register a new one.
3. Visit `/dashboard` and `/profile`.
4. Promote a local account with the backend `make seed-admin` command to access `/admin/users`.

## Development commands

| Command                   | Purpose                                                               |
| ------------------------- | --------------------------------------------------------------------- |
| `pnpm dev`                | Start the development server                                          |
| `pnpm format:check`       | Verify Prettier formatting without changing files                     |
| `pnpm lint`               | Run strict ESLint, Next.js, and complexity checks                     |
| `pnpm typecheck`          | Generate Next route types and check TypeScript without emitting files |
| `pnpm test`               | Run the current Vitest unit tests once                                |
| `pnpm test:report`        | Run Vitest with machine-readable JSON and JUnit evidence              |
| `pnpm test:tooling`       | Verify the client/server import rule                                  |
| `pnpm test:coverage`      | Run unit tests and enforce the initial coverage floor                 |
| `pnpm security:audit`     | Fail on High or Critical dependency vulnerabilities                   |
| `pnpm check`              | Run the main local quality and dependency-security checks             |
| `pnpm generate:api`       | Generate TypeScript contract types from the backend OpenAPI document  |
| `pnpm generate:api:check` | Check generated API types without rewriting them                      |
| `pnpm build`              | Create a production build                                             |
| `pnpm start`              | Serve the production build locally                                    |
| `pnpm test:e2e`           | Drive the real production public UI in desktop/mobile Chromium        |
| `pnpm test:e2e:trace`     | Retain traces for an explicit runtime verification run                |

Run `pnpm exec playwright install chromium` once, then `pnpm build` before browser checks.
See [docs/verification.md](docs/verification.md) for targeted commands, evidence paths,
the workspace runner, test boundaries, and the verification verdict contract.

## Continuous integration

GitHub Actions validates pull requests into `dev` and `main` with governance, formatting, lint,
static analysis, unit coverage, dependency and secret scanning, type checking, and a production
build. The required test scope follows implemented frontend behavior; unfinished backlog epics do
not have placeholder tests that can block merging.

For the exact branch-ruleset check to require, the optional manual security workflow, accepted PR
and branch names, coverage policy, and future full-stack testing plan, see
[docs/ci.md](docs/ci.md).

## Architecture rules

- Keep `src/app` focused on routing and composition; put feature logic under `src/features`.
- Prefer Server Components for initial data and use Client Components only for interaction or browser APIs.
- Use `src/lib/api/server-client.ts` for server-side backend calls and `browser-client.ts` for same-origin BFF calls.
- Keep `BACKEND_API_URL` and `FRONTEND_ORIGIN` server-only; never use `NEXT_PUBLIC_` for secrets or access tokens.
- Treat `src/lib/api/generated/backend.ts` as generated output from `../cu-ways-backend/docs/openapi.yaml`; do not edit it by hand. The generation script falls back to `../backend/docs/openapi.yaml` for this local workspace layout.
- Keep authorization checks in server code and the backend. Proxy redirects are only an early UX check.
- Add `providers/`, `hooks/`, and `types/` only when a concrete shared use case requires them.

## Marketer workspace (EPC-02)

The frontend includes professional profile editing at `/marketer/profile`, service management at
`/marketer/services`, a private performance summary at `/marketer/dashboard`, and signed-in service
viewing at `/marketers/[id]/services`. Open **Marketer workspace** from the existing dashboard.
Profile management, service management, and private performance statistics use the published backend
endpoints. Creator-facing discovery at `/creator/discovery` uses the backend marketer-search contract, including
price, expertise, campus, experience, availability, rating-sort, and pagination parameters. The legacy
`/marketers/[id]/services` viewer remains explicitly unavailable until a public marketer-by-ID catalog
endpoint exists; live pages never substitute sample data.

To review all frontend interactions with fictional data, enable the local demo:

```powershell
$env:MARKETER_DEMO_ENABLED = "true"
pnpm dev
```

Open `/demo/marketer` on the port printed by Next.js. Use Overview, Services, Profile, and Creator
view to review both themes, profile saving, service publishing/editing/deletion, and read-only viewing.
Changes stay in that browser tab's session storage across reloads. **Reset demo** restores fixtures.
Demo changes never call the backend. When browser storage is unavailable, edits remain in memory
until the page reloads. The demo returns 404 unless explicitly enabled and is always disabled in production.

The marketer screens share a fluid desktop frame, with responsive cards and a profile sidebar/form
layout. Desktop browsers use a single 72px sticky header with inline navigation at widths of
1024px and above; narrower windows use a hamburger menu with the same destinations. Phones/tablets
retain their compact header and fixed bottom navigation. Hidden desktop navigation is not focusable,
and widening a desktop window closes its compact menu. Clicking the birds switches between
`/marketer/dashboard` and `/creator/dashboard` in one step (in the demo it only previews the other
role); switching does not change account permissions or call the backend.

Next.js automatically loads `.env.local`, including `MARKETER_DEMO_ENABLED`. Keep it `false` for
normal development and restart the development server after changing it. Explicitly set it to `true`
only when reviewing the demo; production always blocks the demo.

On first visit the theme follows the browser/system preference. A manual light/dark choice persists separately from demo data; dialogs and confirmation controls
follow the chosen theme. Motion is subtle and honors reduced-motion preferences. With the explicit
demo flag enabled, the Next.js development badge is hidden so it does not cover mobile navigation;
compile and runtime errors still appear normally.

The connected backend contracts, required fields, device selection, and remaining
full-stack checks are in [docs/marketer-api-handoff.md](docs/marketer-api-handoff.md).

## Creator offer comparison and hiring (US22 / US23)

Open `/creator/jobs/offers` to choose an owned job. The comparison view uses compact cards,
status tabs, and price/rating/delivery sorting. Marketer details and complete messages open in
an accessible dialog without expanding the grid. Prices preserve satang, delivery dates preserve
their calendar day, and submission dates use Bangkok time.

On a Pending job, each Pending offer has **Accept offer**. Confirmation shows the marketer,
price, delivery date, and consequences before hiring. The existing backend acceptance transaction
marks the job and chosen offer Accepted, rejects competing Pending offers, and closes other
active invitations. Work starts separately. No individual offer-rejection action is introduced.

The frontend reads the authoritative job and offers after acceptance. Stale decisions refresh
the comparison instead of reporting success. An uncertain result disables further acceptance
until **Refresh offers** succeeds; the client never automatically retries a hiring request.
The selected marketer remains visible after a reload. Dark/light themes, keyboard navigation,
dialog focus restoration, and narrow layouts share the workspace's existing UI primitives.

## Direct invitations and custom offers (US20 / US21)

The authenticated `/marketer/invitations` and `/marketer/offer/create?requestId=<id>` routes use
the real backend. Marketers can accept/decline received invitations, submit an initial offer,
and view saved offers after reload. Survey titles identify the work, with Job IDs underneath;
separate job titles, creator budgets, and invitation messages are omitted because the API does
not provide them. Briefs open their real attachment URLs. Optional metadata is shown as unspecified.

Deadline and Target are the only two tags under the heading. Invitation statuses are written as
Awaiting your response, Invitation accepted/declined/closed; job lifecycle status appears only in
eligibility explanations. Offer views emphasize the offer status, with accepted offers explicitly
meaning the marketer has been hired. Survey metadata is available in expandable details, keeping
the summary cards compact. Offer creation shows field errors on blur and preserves drafts.

US24 adds `/marketer/offers`, with All/Pending/Accepted/Withdrawn/Rejected tabs and complete
offer history. Marketers can withdraw Pending offers through a keyboard-accessible confirmation.
Only the latest Withdrawn offer can be resubmitted, while its invitation is Accepted, the job is
Pending, and the deadline has not passed. The replacement form prefills the previous proposal.
Accepted and Rejected offers remain read-only. Conflicts refresh the current status; uncertain
outcomes block further withdrawals until a complete refresh succeeds. Both themes are supported.

The live empty state shares the demo's gray bird, sizing, spacing, and copy. On touch devices,
pull down from the top of the invitation list and release to refresh. Ordinary scrolling and
desktop browser refresh remain available. Healthy screens have no permanent refresh panel;
failed requests offer a small contextual retry action. Success notices use the demo's toast.

Creator survey/job creation screens are not implemented yet. To test this workflow manually,
start the existing local backend with its migrations applied, then run from this repository:

```powershell
pnpm setup:us2021
pnpm dev
```

The setup command creates real local records through the existing APIs: a Creator, a Marketer
with two Pending invitations, one Accepted invitation ready for an offer, one saved offer, and
another Marketer with an empty inbox. The command prints the path to an ignored local JSON file
containing login credentials and scenario IDs. Sign in with `marketer` to test the workflow or
`emptyMarketer` to inspect the gray-bird empty state. Use `creator` and the saved job IDs to send
additional invitations through `/creator/jobs/invite`. These users are separate from demo data.
Each setup run creates fresh records without resetting or deleting existing data. Sample survey
and brief URLs use `example.test` and are intentionally not real forms/documents.
Set `BACKEND_API_URL` in the terminal if the backend is not at `http://127.0.0.1:8081`.

With the local demo flag enabled, open `/demo/marketer?view=invitations` to review invitation
search, Pending/Responded tabs, accept/decline confirmations, optional decline explanations,
custom price offers with delivery dates and messages, and final offer withdrawal. Direct offer
preview: `/demo/marketer?view=offer&requestId=request-063`.

Changes persist in this tab's session storage; **Reset demo** restores all preview fixtures.
The preview uses a fixed 7 October 2026 reference date and never calls the backend. Production
always blocks it. Its fictional fields and withdrawal behavior remain unchanged for preview
compatibility and do not define the live workflow.

See [the integration handoff](docs/invitations-api-handoff.md) for live behavior and verification,
including the separate authenticated desktop/mobile browser suite.

## Backend setup

See the [backend README](../cu-ways-backend/README.md) for PostgreSQL, migrations, API endpoints,
admin seeding, and health checks.

For the full frontend structure and dependency rules, see [docs/architecture.md](docs/architecture.md).

Marketer UI refinements, unified profile tabs, lazy-loading boundaries, and measured bundle changes are documented in [docs/marketer-ui-refinement.md](docs/marketer-ui-refinement.md).
