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

| Command               | Purpose                                                               |
| --------------------- | --------------------------------------------------------------------- |
| `pnpm dev`            | Start the development server                                          |
| `pnpm format:check`   | Verify Prettier formatting without changing files                     |
| `pnpm lint`           | Run strict ESLint, Next.js, and complexity checks                     |
| `pnpm typecheck`      | Generate Next route types and check TypeScript without emitting files |
| `pnpm test`           | Run the current Vitest unit tests once                                |
| `pnpm test:coverage`  | Run unit tests and enforce the initial coverage floor                 |
| `pnpm security:audit` | Fail on High or Critical dependency vulnerabilities                   |
| `pnpm check`          | Run the main local quality and dependency-security checks             |
| `pnpm generate:api`   | Generate TypeScript contract types from the backend OpenAPI document  |
| `pnpm build`          | Create a production build                                             |
| `pnpm start`          | Serve the production build locally                                    |

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
- Keep `BACKEND_API_URL` server-only; never use `NEXT_PUBLIC_` for secrets or access tokens.
- Treat `src/lib/api/generated/backend.ts` as generated output from `backend/docs/openapi.yaml`; do not edit it by hand.
- Keep authorization checks in server code and the backend. Proxy redirects are only an early UX check.
- Add `providers/`, `hooks/`, and `types/` only when a concrete shared use case requires them.

## Backend

See the [backend README](../cu-ways-backend/README.md) for PostgreSQL, migrations, API endpoints,
admin seeding, and health checks.

For the full frontend structure and dependency rules, see [docs/architecture.md](docs/architecture.md).
