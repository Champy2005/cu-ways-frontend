# CU Ways Frontend

Next.js frontend for CU Ways. The app uses the App Router, React, TypeScript, Tailwind CSS, shadcn/ui, and Lucide icons.

The current UI is still the initial starter screen. Backend API integration and product pages will be added incrementally.

## Requirements

- Node.js LTS
- pnpm 11.13.0+

All commands below are run from this directory:

```powershell
cd D:\test-fullstack\cu-way\frontend
```

## Quick start

Install dependencies and start the development server:

```powershell
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

The page uses hot reload. Start editing [src/app/page.tsx](src/app/page.tsx) to change the home page.

## Useful commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm lint` | Run ESLint |
| `pnpm exec tsc --noEmit` | Check TypeScript without emitting files |
| `pnpm build` | Create a production build |
| `pnpm start` | Serve the production build locally |

Run the production flow with:

```powershell
pnpm lint
pnpm exec tsc --noEmit
pnpm build
pnpm start
```

## Project structure

```text
src/app              App Router pages, layout, metadata, and global styles
src/components/ui    Reusable UI components
src/lib              Shared utilities
public                Static assets
components.json       shadcn/ui configuration and aliases
next.config.ts        Next.js configuration
```

The `@/*` import alias points to `src/*`:

```tsx
import { Button } from "@/components/ui/button";
```

## UI conventions

- Add routes and page-level UI under `src/app`.
- Put reusable components under `src/components`.
- Use the existing shadcn/ui components before creating duplicates.
- Use Tailwind utility classes for styling.
- Use Lucide icons through `lucide-react`.
- Keep shared helper functions in `src/lib`.

## Backend

The backend runs separately from the frontend. See the [backend README](../backend/README.md) for PostgreSQL, API, migration, and health-check instructions.

There are currently no frontend environment variables or API client configuration. Add them only when frontend-to-backend integration is introduced.

## Current scope

Implemented:

- Next.js App Router setup
- TypeScript and ESLint
- Tailwind CSS v4
- shadcn/ui Base Nova configuration
- Reusable Button and Input components
- Geist font setup and responsive starter layout

Not implemented yet:

- Authentication screens
- User, creator, and marketer flows
- Survey, job, offer, payment, and review pages
- Backend API client and data fetching
