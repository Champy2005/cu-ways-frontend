<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# CU Ways Frontend Guide

## Scope

This repository contains the CU Ways Next.js web application. It owns pages, layouts, interactive UI, frontend validation, session-aware browser behavior, and calls to the backend.

## Development guidance

- Read `README.md` and `docs/architecture.md` before changing the application structure.
- Keep route composition in `src/app` and feature-specific behavior in `src/features` where that matches the existing design.
- Prefer the simplest suitable component boundary. Use Client Components when interaction or browser APIs require them; otherwise consider Server Components.
- Reuse existing UI primitives, API clients, session helpers, validation patterns, and feedback components.
- Keep authorization meaningful on the server and backend. A frontend redirect is only a user-experience aid, not a security boundary.
- Keep loading, empty, error, and success states understandable for users.
- Add or update focused checks for new behavior and run the relevant lint, typecheck, build, or browser checks.

These are lightweight guidelines. Avoid introducing new global abstractions or reorganizing unrelated features just to complete a small task.

## Backend integration

- Treat the backend as the authority for business rules, permissions, and persisted state.
- Use the existing server-side and browser-side API client conventions.
- If the backend API changes, coordinate the corresponding frontend change and regenerate API types when needed.
- Do not edit generated API output by hand when it can be regenerated from the backend OpenAPI document.
- Keep server-only URLs, credentials, and tokens out of client bundles and public environment variables.

## Safety and verification

- Preserve unrelated working-tree changes and do not push or commit unless requested.
- Do not place secrets in source, examples, screenshots, or test output.
- Before changing a user flow, trace its loading, validation, error, permission, and success states.
- Use the package manager and commands documented in `README.md`; report checks that could not be run.
