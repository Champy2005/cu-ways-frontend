# Frontend/backend handoff — proposal, not an existing API

> **Current presentation authority · 1.6.0:** Read the [design book](../book/README.md), [human principles](../book/PRINCIPLES.md) and canonical [scenario model](model/scenarios.json). Older copy, layout and pending-dismissal descriptions below are retained research/provenance, not current presentation requirements. Current UI uses concise Contract/survey hierarchy and declarative bounded dialogs. Pending operations can dismiss/reopen with12-second unknown/read recovery; closing UI does not claim rollback. Offline Start opens feedback without a write. Domain eligibility, access and server-authority requirements still apply.

## Confirmed implementation baseline

- Backend owns JWT, active memberships, job/offer/request state and transactional hiring.
- `POST /api/v1/me/job-requests/{id}/accept` accepts interest only; `POST /api/v1/jobs/{id}/offers/{offerId}/accept` is Creator hiring and leaves the job Accepted.
- `GET /api/v1/me/job-requests` includes job state, creator, surveys, brief, optional deadline/target. It does not include the selected accepted offer or its agreed terms, and has no hired-jobs pagination contract.
- Existing `GET /api/v1/me/jobs` lists Creator-owned jobs and must keep its contract. `GET /api/v1/jobs/{id}` is also Creator-owned; do not call it from a marketer job-detail screen as though it grants marketer access.
- No start endpoint, marketer hired-job read endpoint, US-025 UI or start-specific runtime proof exists.

The existing request response can inform a later integration, but deriving a hired workspace from `request_status=Accepted` alone is not an adequate authorization or agreed-price contract. A dedicated authorized read surface is recommended over a client join across unrelated APIs.

## Proposed API surface to agree before implementation

Paths are recommendations matching the existing `/me` convention. They are not registered routes today. API owner may change their spelling before contract freeze; frontend must regenerate types from the final OpenAPI, not use this Markdown as a handwritten type definition.

| Operation          | Proposed request                                                 | Proposed success                                                                                                                                               |
| ------------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| List my hired jobs | `GET /api/v1/me/marketer-jobs?status=active&page=1&page_size=20` | Standard success envelope, `data.items` job summaries + `data.pagination` `{page,page_size,total_items,total_pages}`                                           |
| Read hired job     | `GET /api/v1/me/marketer-jobs/{id}`                              | Standard success envelope, `data` JobWorkspace shape below                                                                                                     |
| Start              | `POST /api/v1/me/marketer-jobs/{id}/start` with no body          | Standard success envelope, `data: {job: JobWorkspace, outcome}`; outcome is `started` or `already_in_progress`. Job status is In Progress; can_start is false. |

List status values: `active` (Accepted/In Progress), `Accepted`, `In Progress`, `Completed`, `Cancelled`, `all`; encode spaces normally in URLs. Validate positive page, page_size1–100 (UI requests20); invalid filter/page422. List order job_id descending. Empty results200 with empty items, total_items0,total_pages0,page1. Out-of-range requested page returns empty items with true totals; client moves to last valid page once. No unsupported status totals or unread count badges are fabricated.

### Proposed JobWorkspace fields

| Field                          | Type / source / display                                                                                                                                                                                                                       |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| job_id                         | Existing positive int32; headline Job #{id}. No campaign-title field invented.                                                                                                                                                                |
| job_status                     | Existing exact enum, including Accepted and In Progress; enum validity checked at boundary.                                                                                                                                                   |
| creator                        | Existing `{user_id,name}`. Only necessary name/id; no email/phone enrichment needed.                                                                                                                                                          |
| accepted_offer                 | Proposed read aggregation of existing offer: `{offer_id,marketer_id,offer_status,offered_price,delivery_date}`. Never a client-supplied start payload.                                                                                        |
| accepted_offer.offered_price   | Existing API decimal **string**, e.g. `"8500.00"`; non-negative, up to2 fractional digits, zero valid. Preserve exact decimal representation; convert only through a validated money formatter for display. Never use job budget as fallback. |
| accepted_offer.delivery_date   | Existing nullable date-only `YYYY-MM-DD`; “Agreed delivery” if supplied, otherwise Not specified. Do not confuse it with job deadline or parse it through UTC midnight.                                                                       |
| deadline                       | Existing nullable ISO8601 job deadline; render calendar date in Asia/Bangkok for this project. No deadline set when null.                                                                                                                     |
| target_responses               | Existing nullable non-negative int32; preserve a valid zero, null → Target not specified.                                                                                                                                                     |
| surveys                        | Existing marketer survey read shape: survey_id,title,description,survey_link,target_group,desired_responses,deadline. Summary lists names; detail lists all.                                                                                  |
| brief                          | Existing nullable BriefResponse (latest current brief only); link URL/upload_at as supplied. Do not add a brief-history editor.                                                                                                               |
| permissions.can_start          | Proposed server-computed boolean. True only for hired marketer + Accepted + internally valid selected Accepted offer. False in all other cases. This is a UX capability, not a replacement for POST authorization.                            |
| permissions.start_block_reason | Proposed nullable enum `already_in_progress`, `terminal_state`, `job_not_ready`; no sensitive owner identity in denial text.                                                                                                                  |

Job summary uses the same identifiers/status/creator/accepted terms, survey names and deadline, with server-computed permissions if useful; list never provides an inline Start. Required identity, status, accepted terms and capabilities must be complete before a ready detail is shown. Missing optional context does not block. Persistently inconsistent ownership/selected offer returns a structured job_not_ready conflict instead of a guessed price/capability.

### Required start semantics

Atomic operation: derive actor → verify active marketer membership → lock job → select/verify accepted_offer belongs to this job, has offer_status Accepted and marketer_id is actor → if job Accepted, set only job_status In Progress → commit → return authorized current workspace. Hiring alone remains Accepted. Starting does not rerun competitor resolution or change accepted_offer_id. If a future audit timestamp is added, set it only on the first transition; no timestamp/migration is required by this design.

**Idempotent state action:** same hired marketer starting an already In Progress job receives 200 with current workspace, with `outcome=already_in_progress`, no additional transition or repeated side effects. A new transition returns `outcome=started`. Do authorization before granting this repeat-success response. This makes user-confirmed retry safe even if an earlier timed-out request later commits. Completed/Cancelled still conflict; start never resets or rewinds them. An idempotency key is not required for a state-only update, but later non-idempotent notifications/audit effects must be deduplicated transactionally. If backend chooses non-idempotent semantics instead, unknown-outcome recovery must be redesigned before frontend implementation.

HTTP400/422 or recognized business errors must leave state unchanged. Database failures roll back. A transport/5xx error does not establish that commit did not happen, so the client always reconciles rather than claiming rollback.

## Proposed failure mapping

Existing response envelope is `{status:"error", error:{code,message,...}}`; use code/category rather than substring matching raw error messages. Preserve X-Request-ID for diagnostics without exposing token/SQL details in the UI.

| HTTP / proposed code                                  | UI state                                                     | Recovery                                                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| 401 unauthorized                                      | D10/R09                                                      | Sign in then GET; no auto POST.                                                                        |
| 403 marketer_required                                 | D07                                                          | Workspace link; clear private job data.                                                                |
| 403 start_forbidden with still-authorized detail read | R07                                                          | Alert, remove Start; re-read capability.                                                               |
| 404 job_not_found for missing/non-owner               | D06/R08                                                      | Same generic unavailable view and no details.                                                          |
| 409 job_not_startable                                 | R06                                                          | GET authoritative detail and show terminal state; an authorized repeat on In Progress uses200, not409. |
| 409 job_not_ready                                     | D08/R10                                                      | Refresh; no raw mismatch exception or client offer selector.                                           |
| 422 validation_error                                  | D06 for invalid path; D08 for invalid contract payload       | No mutation; safe navigation/read recovery. No editable price/offer form exists to correct.            |
| 429 rate_limited, if infrastructure supplies it       | Inline “Too many attempts. Please wait before trying again.” | Honor Retry-After; no automatic start replay; refresh before new confirmation.                         |
| 503 feature_unavailable explicitly before processing  | L09 / feature unavailable                                    | Back to overview; if processing status is not guaranteed, reconcile first.                             |
| 5xx/timeout/disconnect/malformed positive response    | R01–R04                                                      | GET; unknown outcome if read fails; Start locked until reconciled.                                     |

These new error names are proposals, not already implemented backend codes. Other marketer's job should use404 to avoid enumeration; a legitimate previously visible job may show a generic permission alert only if its detail read remains authorized. Never preserve full cached details after a read denial.

## Frontend composition proposal

- Routes compose under marketer layout: list + detail. Feature owner may use `src/features/marketer-jobs`; reuse existing shared shell/buttons/dialog/feedback/API clients. No generic AppShell swap.
- BFF/server actions keep session cookie and server-only backend URL conventions. Client never reads JWT. Route guard is a UX aid; backend enforces ownership.
- Keep distinct load state, domain lifecycle and mutation state; a UI spinner is not a new job_status. No `Starting`/`Unknown` database lifecycle values.
- Read capability/state on initial detail, focus return, explicit refresh and after ambiguous responses or terminal 409 conflicts. Ignore stale fetches for old job/filter or superseded request generations.
- One in-flight POST/job in the rendered client. 10s slow message,20s client transport deadline. Deadline abort stops waiting, not necessarily server commit. No optimistic In Progress.
- Successful response must match requested job_id and hired actor, contain valid `data.job` In Progress/permissions and recognized `outcome`; otherwise reconcile. Use outcome to distinguish a new start from an already-in-progress response. Invalidate list/detail caches; confirmation result is not an invitation-accept result.
- Mutation outcome unknown: refresh first. If verified Accepted and specified atomic idempotency is available, allow a new deliberate confirmation. If In Progress, show already-in-progress. A concurrent authorized POST returning 200/already_in_progress takes the same display path;409 is reserved for terminal/not-ready states. Failed read keeps Refresh only.
- Existing frontend generated API types must be regenerated only after OpenAPI changes are approved and implemented. `pnpm generate:api:check` proves schema agreement, not permission or persistence.

## Ownership and sequencing

Thn owns frontend story work; Hin owns backend story work per backlog. Before either implements: reconcile stale US-025 acceptance text, agree the authorized read/start/error shape, update OpenAPI, then regenerate client types. Use one implementation owner per coupled repository area; coordinate cross-repo contracts before edits. Figma production can use these fields as explicitly proposed contract requirements, with dependency notes visible in the handoff.
