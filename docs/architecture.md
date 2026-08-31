# CU Ways Frontend Architecture

## Purpose

This document defines the project structure, dependency boundaries, and development conventions for the CU Ways frontend. It is intended for developers adding authentication, user, survey, job, offer, payment, and review features.

The frontend uses the Next.js App Router with Server Components by default and a feature-based organization for business-facing UI, API calls, validation, and types.

## Project structure

The tree below is representative of the current implementation. Add feature-specific files only when the feature has a real page, interaction, API contract, or test.

```text
frontend/
├── src/
│   ├── app/                              # App Router routes, layouts, and boundaries
│   │   ├── (public)/                     # Public routes; group name is not in the URL
│   │   │   ├── page.tsx                  # Landing page: /
│   │   │   ├── login/page.tsx            # Login page: /login
│   │   │   └── register/page.tsx         # Registration page: /register
│   │   ├── (app)/                        # Authenticated user area
│   │   │   ├── layout.tsx                # Session guard and application shell
│   │   │   ├── dashboard/page.tsx        # Dashboard: /dashboard
│   │   │   ├── profile/page.tsx          # Current user profile: /profile
│   │   │   ├── surveys/                  # Survey pages: /surveys
│   │   │   └── jobs/                     # Job pages: /jobs
│   │   ├── (admin)/admin/                # Admin route group and /admin URL segment
│   │   │   ├── layout.tsx                # Admin permission guard
│   │   │   └── users/                    # Admin user management pages
│   │   ├── api/auth/                     # Thin BFF adapters for authentication
│   │   │   ├── login/route.ts
│   │   │   ├── register/route.ts
│   │   │   └── logout/route.ts
│   │   ├── layout.tsx                    # Root HTML layout and metadata
│   │   ├── error.tsx                     # Application error boundary
│   │   ├── not-found.tsx                 # 404 boundary
│   │   └── globals.css                   # Global styles and design tokens
│   ├── features/                         # Self-contained feature modules
│   │   ├── auth/                         # Auth API, schemas, types, and forms
│   │   └── users/                        # User API, types, and user UI
│   ├── components/                       # Truly shared UI and application shell
│   │   ├── ui/                           # Base UI primitives
│   │   ├── layout/                       # App shell and navigation
│   │   └── feedback/                     # Error, empty, and placeholder states
│   ├── lib/                              # Shared technical helpers
│   │   ├── api/                          # Backend clients, errors, envelopes, and contracts
│   │   │   └── generated/                # Types mirrored/generated from backend OpenAPI
│   │   ├── auth/                         # Cookie session, guards, permissions, and token claims
│   │   ├── env.ts                        # Server-side environment access
│   │   └── utils.ts                      # Generic utilities
│   └── proxy.ts                          # Lightweight request redirect boundary
├── docs/architecture.md                  # This architecture document
├── public/                               # Static assets
├── .env.example                          # Safe environment template
├── next.config.ts                        # Next.js configuration
├── package.json                          # Scripts and dependencies
└── tsconfig.json                          # TypeScript configuration and @/* alias
```

The main request flows are:

```text
Public authentication:
Browser → feature form → /api/auth/* → Go backend /api/v1/auth/*
                                      → HttpOnly session cookie

Authenticated page:
Browser → proxy redirect check → Server Component/layout
                              → server-client → Go backend
```

The dependency direction points toward reusable application code. Route files compose features; feature modules use shared technical helpers; the backend remains the authority for authentication, authorization, and business rules.

## Layer responsibilities

### `src/app`

The App Router layer owns URL structure and page composition.

- Define `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, and `not-found.tsx` files.
- Compose feature components and call feature-level server functions where appropriate.
- Keep pages small and free of reusable business rules.
- Use route groups to organize layouts without changing public URLs.

Pages should describe what is rendered, not how a feature performs its business operation.

### Route groups

- `(public)` contains pages that do not require a session.
- `(app)` contains the authenticated user experience and calls `requireSession()` in its layout.
- `(admin)` contains administrator pages. The physical `admin` segment produces `/admin/*`, while `(admin)` itself is not part of the URL.

Route groups are organizational and layout boundaries. They are not a replacement for backend authorization.

### `src/app/api`

Route Handlers are thin Backend-for-Frontend adapters. Current handlers proxy login, registration, and logout.

They may:

- Parse and validate the incoming request shape.
- Call the Go backend.
- Translate the backend envelope and status.
- Set or clear the `cuways_session` HttpOnly cookie.

They must not become a second business-logic layer. User authorization and domain rules stay in the Go backend.

### `src/features`

Each feature owns the UI and client-facing behavior for one business capability.

A feature may contain:

- `api.ts` — feature API functions.
- `schemas.ts` — input validation and form rules.
- `types.ts` — feature-specific types and contract aliases.
- `components/` — feature-specific UI.
- `hooks/` — feature-specific hooks, only when needed.

Feature modules should be cohesive and independently testable. A feature must not import another feature's private components directly. Move genuinely shared UI or behavior to `components` or `lib` after a real reuse case appears.

### `src/components`

Contains UI shared across two or more features.

- `ui/` contains low-level primitives such as buttons and inputs.
- `layout/` contains navigation and application shell components.
- `feedback/` contains loading, empty, error, and placeholder states.

Do not place feature-specific tables, forms, or business workflows here merely because they are visually reusable.

### `src/lib/api`

Provides the transport boundary between the frontend and backend.

- `server-client.ts` reads the HttpOnly cookie in server code and forwards the bearer token to the Go backend.
- `browser-client.ts` calls same-origin Next.js endpoints and never needs the backend URL or JWT.
- `backend-client.ts` is used by server-side Route Handlers and talks to `BACKEND_API_URL`.
- `errors.ts` normalizes backend error envelopes into `ApiError`.
- `envelope.ts` contains environment-independent response-envelope helpers.
- `generated/` is the contract boundary for types derived from `backend/docs/openapi.yaml`.

The contract file is generated from `backend/docs/openapi.yaml` with `pnpm generate:api`. It is isolated so regeneration does not require changing feature UI APIs. Do not edit generated output by hand.

### `src/lib/auth`

Contains session and authorization helpers used by server code and the request boundary.

- `session.ts` reads the `cuways_session` cookie in Server Components and server utilities.
- `guards.ts` redirects unauthenticated or non-admin users at the page boundary.
- `permissions.ts` contains small reusable permission predicates.
- `token.ts` decodes claims for UI routing only.

The frontend does not verify JWT signatures. The Go backend verifies the token and enforces authorization on every protected API request.

### `src/proxy.ts`

Proxy performs an early, optimistic redirect for protected paths:

- No usable session cookie → redirect to `/login`.
- A non-admin claim requesting `/admin/*` → redirect to `/dashboard`.

Proxy is an experience optimization, not a security boundary. It must not be the only authorization check because claims can be stale or invalid. The backend remains authoritative.

### `src/lib/env.ts`

Environment access is server-only by import boundary.

```env
BACKEND_API_URL=http://localhost:8081
```

Do not expose `BACKEND_API_URL`, access tokens, or other secrets through `NEXT_PUBLIC_*` variables or client components.

## Dependency rules

The following rules are mandatory:

1. `src/app` may compose routes and features, but reusable business logic belongs in `features` or `lib`.
2. `src/features` may use shared `components` and `lib`, but must not depend on another feature's private implementation.
3. Client Components must not import server-only modules such as `next/headers`, `env.ts`, `session.ts`, or `server-client.ts`.
4. Browser code must call same-origin BFF endpoints through `browser-client.ts`; it must not call the Go backend directly with a secret URL or bearer token.
5. Server Components and Server Actions should call the backend directly through `server-client.ts` rather than making an unnecessary request to a local Route Handler.
6. `src/app/api` may adapt transport and cookies, but must not duplicate backend business rules.
7. `src/lib/api/generated` is a contract boundary; generated files should not contain UI code or secrets and must not be edited by hand.
8. Shared components must remain domain-neutral. Feature-specific behavior belongs under its feature.
9. Prefer explicit dependency injection through function arguments or constructors over global mutable stores.
10. Do not introduce a global state library until a concrete cross-page client-state requirement exists.

## Server and client boundary

Server Components are the default. Add `"use client"` only when a component requires:

- `useState` or another client hook.
- Event handlers or interactive form state.
- Browser APIs.
- Client-side navigation or effects.

Current Client Components are limited to interactive authentication forms and logout behavior. Keep layouts and page shells on the server where possible to reduce client JavaScript.

Never pass the raw JWT to a Client Component. The BFF removes `access_token` from the browser-visible authentication response and stores it in an HttpOnly cookie instead.

## Authentication flow

Authentication uses a Backend-for-Frontend boundary:

1. The login or register form submits to `/api/auth/login` or `/api/auth/register`.
2. The Route Handler validates the request and calls the Go backend.
3. The backend returns an access token and sanitized user data.
4. The Route Handler stores the token in the `cuways_session` HttpOnly cookie and removes it from the response body.
5. Server-side API calls read the cookie and send `Authorization: Bearer <token>` to the backend.
6. The backend verifies the signature, expiry, subject, and role for each protected request.
7. Logout clears the session cookie through `/api/auth/logout`.

The cookie is configured with `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` in production. There is currently no refresh-token or token-revocation flow.

## Validation boundary

Validation is split by responsibility:

### Frontend transport validation

Feature schemas and Route Handlers validate:

- JSON shape and primitive types.
- Required fields and basic length limits.
- Email and password format needed to submit a form.
- User-facing form error messages.

This improves usability but must not be treated as a security boundary.

### Backend business validation

The Go backend validates:

- Authentication and authorization.
- Ownership and admin permissions.
- Uniqueness and database-backed invariants.
- Domain state transitions.
- Any rule that must also apply to non-browser clients.

Frontend validation may be stricter for usability, but it must not weaken the backend contract.

## Data fetching and state management

Use the simplest state owner that meets the requirement:

- Initial page data: Server Components and `server-client.ts`.
- Authentication form mutations: same-origin BFF Route Handlers.
- Interactive client-server state: add React Query or SWR only when polling, cache invalidation, or optimistic updates justify it.
- Local UI state: `useState` inside the owning Client Component.
- Cross-page client state: introduce a store only for a proven requirement.

The backend is the source of truth for users and future domain entities. Do not create a global store that duplicates server data without a clear synchronization strategy.

## Adding a new feature

Use this sequence when adding a feature such as surveys or jobs:

1. Confirm the backend endpoint and OpenAPI contract.
2. Run `pnpm generate:api` to regenerate the contract types in `src/lib/api/generated`.
3. Create `src/features/<feature>/types.ts` and `api.ts`.
4. Add feature schemas for form and query validation.
5. Implement feature-specific components under `components/` inside the feature.
6. Add a small App Router page under the appropriate route group.
7. Use a Server Component for initial data and Client Components only for interaction.
8. Add a BFF Route Handler only when the browser needs a same-origin adapter, cookie operation, or server-side secret.
9. Add unit/component tests for schemas and feature UI, then add an end-to-end test for the user journey.
10. Update this document only when a shared boundary or architectural rule changes.

Do not create empty feature folders, speculative global stores, or generic API abstractions before a real use case exists.

## Testing and verification

Run from `frontend/`:

```powershell
pnpm lint
pnpm typecheck
pnpm build
```

Recommended test coverage:

- Feature schema tests for valid, invalid, and boundary inputs.
- Component tests for form submission, loading, and error states.
- API client tests for envelope parsing and backend error normalization.
- End-to-end tests for register, login, protected navigation, admin access, and logout.

When testing protected pages, run the Go backend and use a development admin seeded through the backend tooling. Do not place real credentials or JWTs in source files, screenshots, or test fixtures.

## Anti-patterns to avoid

- Putting API calls and business rules directly in large `page.tsx` files.
- Importing `next/headers` or server API clients into Client Components.
- Storing JWTs in `localStorage`, `sessionStorage`, or React state.
- Calling the Go backend directly from browser code with a public environment variable.
- Treating `proxy.ts` as the only authorization layer.
- Duplicating backend business rules in Next.js Route Handlers.
- Creating a global store for data already owned by the backend.
- Sharing feature-private components by reaching into another feature folder.
- Manually editing generated API output instead of updating the OpenAPI source contract and regenerating it.
- Adding a library or abstraction before a concrete requirement justifies it.

## Current status

The frontend foundation includes public authentication pages, HttpOnly-cookie BFF routes, protected dashboard/profile routes, an admin users area, typed clients for the current backend User API, shared layout/feedback components, and the Next.js 16 `proxy.ts` boundary.

Survey, job, offer, payment, review, and richer user-management workflows remain feature work for future iterations. Their route placeholders should be replaced only when the corresponding backend contracts are available.
