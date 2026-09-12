# Marketer integration status

The live marketer workspace now uses the backend contracts in the sibling repository's
`docs/openapi.yaml`. Types are generated with `pnpm generate:api`; generated output must not be
edited by hand. The Go backend and database are not required for frontend unit checks.

## Connected endpoints

| Frontend operation               | Same-origin browser adapter | Backend contract                     |
| -------------------------------- | --------------------------- | ------------------------------------ |
| Read professional profile        | Server query                | `GET /api/v1/me/marketer-profile`    |
| Create/save professional profile | `PUT /api/marketer`         | `PATCH /api/v1/me/marketer-profile`  |
| List own services                | Server query                | `GET /api/v1/me/services`            |
| Create service                   | `POST /api/services`        | `POST /api/v1/me/services`           |
| Edit service                     | `PUT /api/services/{id}`    | `PATCH /api/v1/me/services/{id}`     |
| Delete service                   | `DELETE /api/services/{id}` | `DELETE /api/v1/me/services/{id}`    |
| Save contact information         | `PUT /api/profile`          | `PUT /api/v1/users/{session.userId}` |

Browser adapter PUT methods are preserved for compatibility; their server implementations translate
to the backend's PATCH methods. Browser requests never include a bearer token or backend URL. The
adapters require the configured frontend origin and an HttpOnly session, and reject unrelated fields
such as caller-supplied ownership. Backend authorization remains authoritative.

Profile saves require bio and availability text (1–5,000 characters), integer experience (0–80),
and availability status (`available`, `limited`, or `unavailable`). Existing expertise and campus
options are preserved as slugs on every save. New profiles send empty arrays because there is no
catalog-options listing contract for offering new selections. Only a `404 marketer_profile_not_found`
response opens onboarding; generic 404s, outages, and authentication failures do not.

Services use decimal-string prices and nullable scope text (maximum 5,000 characters). The service
response has no `user_id`; ownership is enforced by the backend's `/me/` routes. A successful backend
delete returns `200` with `{ service_id, deleted: true }`. The adapter validates the matching ID and
confirmation before returning an empty `204` to the browser. Failed/malformed responses never remove
a service from the displayed list. Saves retain drafts on failure and reflect confirmed responses.

## Required identity fields

Registration requires first name, last name, phone number, and email, with visible asterisks and
associated errors. First/last names are trimmed and joined with one space into the existing backend
`name` field. The combined name is limited to 100 characters. This does not introduce separate
persisted name fields or attempt to split existing names.

Phone is required when saving contact information; LINE ID remains optional and can be cleared.
Existing profile name/email stay read-only because the current backend update contract does not
support changing them. Existing accounts can still load when their stored phone is empty, but must
provide one on the next contact save. The frontend's stricter requirement does not change backend
business validation for other clients.

## Unavailable features

There is no dedicated private statistics endpoint or public marketer-by-ID service catalog endpoint
in the current backend contract. Live pages show explicit unavailable states and do not call the
previous proposed URLs, fabricate zero totals, or substitute preview data. The creator-facing search
API is not used to approximate an individual catalog. Jobs, Messages, discovery, surveys, and role
switching remain outside this migration.

## Device-specific navigation

The request user agent selects the phone/tablet bottom bar. Desktop and unrecognized agents use
inline header navigation at 1024px and above and the hamburger below that breakpoint. Desktop never
mounts a bottom bar. Phone/tablet agents retain the bottom bar at wide widths, including rotation.
This is presentation only and is not an authentication boundary.

Desktop uses a single 72px sticky header. The compact menu shares Overview, Services, Profile, and
(demo only) Creator view with the primary navigation, plus Workspace and the existing sign-out action.
An open desktop menu closes when expanding to 1024px. The birds open an animated Marketer/Creator
preview picker; selection is transient UI state and never changes sessions, permissions, or backend data.

## Demo and dry verification

`MARKETER_DEMO_ENABLED=true` enables `/demo/marketer` only outside production. The isolated demo
shares forms and navigation with live pages, uses the updated contract shapes, and never calls the
backend. Its session storage key is now `cuways-marketer-demo-v2`; old provisional fixtures are not
loaded. Reset restores fictional profiles, services, contacts, and preview statistics. Sign out is
marked preview-only in the demo.

Run `pnpm check` for formatting, lint, route types/TypeScript, unit coverage, dependency audit, and a
production build. Tests cover required registration/contact fields, request paths and methods,
profile onboarding, catalog-selection preservation, service CRUD, malformed deletion confirmations,
permission failures, unavailable endpoints, draft retention, preview isolation, and device selection.
Browser verification should use desktop and mobile user agents independently at 375, 767, 768, and
1440px in both themes. Intercept upstream fetches inside the frontend process to exercise real pages
and BFF adapters without starting Go, Docker, or PostgreSQL.

Actual persistence across sessions, real token verification, foreign-owner rejection, backend
validation, and database-backed behavior still require a later live integration run with the backend.
Dry checks do not establish those properties.

### Verification recorded on 2026-09-11

- Formatting, strict lint, TypeScript, and production build passed.
- All 155 tests passed across 24 files; coverage thresholds passed (76.96% lines).
- Chrome browser checks passed with desktop and iPhone user agents at all four widths in both
  themes (16 combinations). Before the responsive header update, same-page resizing preserved navigation; desktop pages
  contained no mobile bar. Keyboard activation, Escape/focus restoration, outside-click dismissal,
  sticky positioning, horizontal overflow, and mobile save-button clearance were checked.
- Real Next pages and BFF adapters passed against in-process mocked upstream fetches: initial
  profile creation, save/reload, rejected-save draft retention, required-phone validation/contact
  save, service creation/editing/deletion/reload, and session-clearing sign-out. This used a separate
  temporary frontend copy, leaving the existing development server running.
- `pnpm check` stopped at the dependency audit: the existing lockfile includes `js-yaml@4.3.1`,
  reported with High advisory `GHSA-2883-xcg3-v3hh` (patched in 4.3.2), plus three Moderate reports.
  The production build was run separately and passed. No dependency versions were changed here.
- No Go backend, database, or Docker services were started. Live backend acceptance remains pending.
