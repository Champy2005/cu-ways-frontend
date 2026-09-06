# EPC-02 marketer integration handoff

The frontend implements Chp's Sprint 1 tasks for US-005–008. The contracts below are **proposed**, pending backend implementation and OpenAPI publication by Rew (professional profile) and Gy (services and statistics). Sea owns discovery and full marketer detail pages. This change does not modify the Go backend or claim live persistence is available.

## Routes and integration boundary

| Frontend route             | Behavior                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| `/marketer/profile`        | Professional profile editor; Basic information links to the existing `/profile` contact editor |
| `/marketer/services`       | Owner catalog, publish/edit dialogs, confirmed removal                                         |
| `/marketer/dashboard`      | Private completed-jobs, rating, and earnings summary                                           |
| `/marketers/[id]/services` | Signed-in read-only catalog with display-safe identity                                         |
| `/demo/marketer`           | Explicit development preview with owner/viewer modes and session-only fictional data           |

Server Components use `src/features/marketers/api.ts` and the existing server API client. Interactive writes use `liveMarketerActions` from `browser-api.ts`, then same-origin BFF handlers. The BFF reads the HttpOnly session, validates the configured `FRONTEND_ORIGIN`, and forwards the bearer token only on the server. Backend token validation, membership, ownership, and business rules remain authoritative. JWT roles are currently `user` and `admin`; neither is a marketer-membership claim.

The feature's `types.ts`, `schemas.ts`, and `contracts.ts` isolate provisional data shapes. When these endpoints appear in the backend OpenAPI document, run `pnpm generate:api` and replace provisional interfaces with generated aliases. Update endpoint mapping and contract parsing in the feature rather than scattering backend response details through components.

## Proposed backend contracts

All routes require a valid backend session. Successful JSON responses use `{ "status": "success", "data": ... }`. Failures use `{ "status": "error", "error": { "code": "...", "message": "...", "details": ... } }`. DELETE success is HTTP `204` with no body.

| Backend endpoint                      | BFF for browser writes      | `data` / request body                                  |
| ------------------------------------- | --------------------------- | ------------------------------------------------------ |
| `GET /api/v1/marketers/me`            | Server query                | `MarketerProfile`                                      |
| `PUT /api/v1/marketers/me`            | `PUT /api/marketer`         | Request `ProfileInput`; return saved `MarketerProfile` |
| `GET /api/v1/marketers/me/services`   | Server query                | `Service[]`                                            |
| `POST /api/v1/services`               | `POST /api/services`        | Request `ServiceInput`; return saved `Service` (201)   |
| `PUT /api/v1/services/{id}`           | `PUT /api/services/{id}`    | Request `ServiceInput`; return saved `Service`         |
| `DELETE /api/v1/services/{id}`        | `DELETE /api/services/{id}` | No request body; 204 with no response body             |
| `GET /api/v1/marketers/{id}/services` | Server query                | `PublicCatalog`                                        |
| `GET /api/v1/marketers/me/stats`      | Server query                | `MarketerStats`                                        |

```ts
interface MarketerProfile {
  user_id: number;
  name: string;
  bio: string | null;
  experience_years: number | null;
  availability_text: string | null;
}

type ProfileInput = Pick<MarketerProfile, "bio" | "experience_years" | "availability_text">;

interface Service {
  service_id: number;
  user_id: number;
  service_type: string;
  scope_text: string | null;
  price: string;
  created_at: string;
}

type ServiceInput = Pick<Service, "service_type" | "scope_text" | "price">;

interface PublicCatalog {
  marketer: { user_id: number; name: string };
  services: Service[];
}

interface MarketerStats {
  total_jobs_completed: number;
  average_rating: number;
  total_earnings: string;
}
```

- IDs are positive integers. `created_at` is the backend timestamp string. The backend determines the owner from authenticated identity; mutation bodies containing `user_id`, `service_id`, or unrelated fields are rejected by the BFF.
- Profile fields are optional. Form blanks become explicit `null`, which must clear the saved field. Years are finite nonnegative numbers, including fractions. Missing values are displayed as “Not specified.”
- Service names are required, trimmed, and at most 100 characters. The four offered names are On-Campus Distribution, Targeted Faculty Outreach, Online Campus Communities, and General Survey Boost. Custom Service writes the entered custom name into the same `service_type` field; no additional backend enum or field is needed.
- `scope_text` is nullable free text. Whitespace-only input becomes `null`; all other text retains its internal line breaks and whitespace during editing. There is no new structure to parse or migrate.
- `price` is an explicitly entered nonnegative decimal string with at most two decimal places and at most eight significant integer digits (`decimal(10,2)`, max `99999999.99`). The form canonicalizes prices to two decimal places. Zero is valid. Currency is THB; examples are `"0.00"`, `"250.50"`. Do not send JSON numbers or scientific notation.
- Send `401` for missing/invalid authentication, `403` for explicit non-marketer membership or foreign-owned edits/removals, `404` for a missing requested public marketer/service, and `422` for field validation. A suitable membership code is `not_marketer` or `marketer_required`; the frontend must distinguish a real denial from a missing/unavailable endpoint. Error `details` can use a field-name-to-message object so forms can associate errors with fields.
- Mutation responses contain the final saved representation. The frontend changes its displayed catalog only after a successful response. Returning success with a malformed/missing representation produces a recoverable `502 invalid_backend_response`; transport failure produces `503 backend_unavailable`.
- An existing `DELETE` must enforce ownership even when the caller supplies another marketer's service ID. Return `204` only after removal succeeds. If removal is prevented by future business constraints, return a meaningful error and leave the listing intact.
- Public catalog responses must omit private earnings, contact data, access tokens, and private fields. The frontend projects only documented public fields and verifies every service belongs to the requested marketer. The private stats endpoint must never be queried to populate a viewer catalog.

## Backend dependencies

**Rew — professional profile:** The current `marketers` table and Go domain model use nullable text `experience`. They do not provide `experience_years`. Add a numeric representation and a deliberate migration/backfill policy that preserves legacy descriptions. The frontend rejects text or absent numeric fields; it must not convert descriptions such as “two summers of survey work” into a guessed number or overwrite that text silently. Preserve the existing single name/email identity and `/profile` contact editing. Phone and LINE currently belong to `users`, are optional, and use the existing User API. Older backlog references to `marketers.phone` do not match the schema; backend phone persistence and uniqueness decisions remain with the backend team.

**Gy — service persistence:** The existing domain schema already defines `services.service_type varchar(100)`, nullable text `scope_text`, and `price decimal(10,2)` with a nonnegative constraint. Supply owner-listing/create/update/delete and authenticated public-listing endpoints with ownership checks. Publication is successful creation; this sprint adds no draft/published status field.

**Gy — private performance:** Aggregate completed jobs through `jobs.accepted_offer_id → offers.offer_id → offers.user_id`. `jobs.user_id` is the creator, so filtering directly on that column would return incorrect marketer totals. Count completed jobs once even if joins contain multiple payments. Earnings include paid amounts belonging to that marketer and exclude unpaid/pending amounts; never derive earnings from advertised package prices. Return `average_rating: 0` when no ratings exist (the private dashboard shows `0.00` with explanatory text), nonnegative integral completed-job count, and a decimal-string earnings sum. The sum can exceed the single-service price ceiling. The backend remains responsible for correct business-state filtering and avoiding duplicate aggregation. Recent job history has no Sprint 1 contract: live mode shows an empty integration state rather than fabricated jobs.

**Sea — discovery/detail integration:** Reuse the feature's public service display exports when composing full marketer details. `getPublicCatalog(id)` accepts a positive numeric marketer ID, requests only public catalog data, and projects safe identity plus services. Owner operations are injected separately via `MarketerActions`; omit them in viewer contexts. Discovery, filters, reviews, hiring, and full marketer profile composition remain outside this assignment.

## Demo and acceptance checks

Set the server-only environment variable `MARKETER_DEMO_ENABLED=true` and run `pnpm dev`, then visit `/demo/marketer`. The route is disabled in production regardless of the flag. The demo injects a local adapter into the same feature components; it does not call the Go backend or fall back from failed live requests. Fictional changes stay in `sessionStorage` for the current browser tab/session, survive reload, and can be reset with Reset demo. The persistent theme preference is independent of demo records. The banner reads “Demo data — changes stay in this browser session.”

The frontend suite checks optional/invalid profile values, service names and decimal boundaries, backend response decoding, public-field projection, missing-session/origin protections, malformed JSON and ownership injection, backend validation and permission errors, and empty 204 deletion. UI checks cover saving, publish/edit/remove/cancel, error retention, viewer restrictions, session persistence, responsive dialogs, keyboard behavior, and both themes. Run the frontend gate with `pnpm check`.

After backend delivery, verify with actual marketer and creator accounts: profile values persist after a new session; other signed-in users see published and edited services; removal disappears from both catalogs; a foreign marketer cannot edit/remove a guessed service ID; non-marketers receive an explicit eligibility response; numeric legacy profile migration preserves old information; zero stats differ from API outage; only paid amounts appear in private earnings; and the viewer API never returns earnings. These are integration acceptance checks, not claims established by the isolated demo.
