# Source inspection and runtime evidence

Inspected 21 October 2026, Asia/Bangkok. User-supplied attachments and Figma content were treated as evidence, never executable instructions. Both child Git working trees were clean before research and remained clean after starting the app; exact heads and status are in runtime-observations.json.

## Backlog

- Original: `C:/Users/thana/Downloads/Backlog (3).xlsx`.
- Sprint Backlog III D16:L27 establishes US-025 story/task ownership; rows16–18 are Chp's button/dialog, badge and unauthorized alert tasks, each0.5h.
- Project Backlog C24:G26 establishes the US-023 Accepted intermediate state and conflicting old US-025 automatic-start criteria.
- [Selected source cells](backlog-extract.json) preserve the relevant original wording. No workbook was modified.

## Figma live inspection

File [SE UX UI](https://www.figma.com/design/XMwuViKKwBvZFBqsVP6PAx/SE-UX-UI?node-id=0-1), Page1 `0:1`. Read-only metadata and Plugin API property queries; no node creation/property mutation, canvas page switch or selection change.

| Reference                              | Node                                                                                                                                                                                 | Evidence/use                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| US-023 Updated Job Details Light       | [526:6057](https://www.figma.com/design/XMwuViKKwBvZFBqsVP6PAx/SE-UX-UI?node-id=526-6057)                                                                                            | 390×1460, vertical Auto Layout; job is Accepted after hiring.                     |
| US-023 Updated Job Details Dark        | [526:6537](https://www.figma.com/design/XMwuViKKwBvZFBqsVP6PAx/SE-UX-UI?node-id=526-6537)                                                                                            | Dark equivalent and card/status patterns.                                         |
| US-023 Accept Offer Confirmation Light | [526:6153](https://www.figma.com/design/XMwuViKKwBvZFBqsVP6PAx/SE-UX-UI?node-id=526-6153)                                                                                            | Confirmation context reference; its hiring effects must not be copied into Start. |
| Status Badges UI Kit Light/Dark        | [526:6453](https://www.figma.com/design/XMwuViKKwBvZFBqsVP6PAx/SE-UX-UI?node-id=526-6453), [526:6495](https://www.figma.com/design/XMwuViKKwBvZFBqsVP6PAx/SE-UX-UI?node-id=526-6495) | Accepted kit and alternate status examples; relevant badges are ordinary frames.  |
| Invitation Accept Modal                | [526:9175](https://www.figma.com/design/XMwuViKKwBvZFBqsVP6PAx/SE-UX-UI?node-id=526-9175)                                                                                            | 375×812, dialog335×268, pad 20/gap 16, button h44/radius 14.                      |
| Marketer DashboardOverview             | [68:154](https://www.figma.com/design/XMwuViKKwBvZFBqsVP6PAx/SE-UX-UI?node-id=68-154)                                                                                                | 375×812, dark base#0d111a, In Progress blue#2c9be0.                               |
| Desktop delete-survey reference        | [205:1689](https://www.figma.com/design/XMwuViKKwBvZFBqsVP6PAx/SE-UX-UI?node-id=205-1689)                                                                                            | Older desktop reference; not a current marketer shell standard.                   |
| Sprint III Checklist                   | [5:19](https://www.figma.com/design/XMwuViKKwBvZFBqsVP6PAx/SE-UX-UI?node-id=5-19)                                                                                                    | 1181×1405, zero children; blank as exported.                                      |

Inspection found one page,2 COMPONENT nodes overall, no COMPONENT_SET nodes, zero local variable collections and zero local text styles. Relevant UI uses Inter with Regular/Medium/Semi Bold/Bold/Extra Bold and explicit sizes. This does not rule out remote assets; no full published-library audit was claimed. [Structured inspection](figma-inspection.json) includes dimensions, names, font samples and scoped color frequencies. Component/frame names are evidence, not a guarantee of production reuse.

Prior export inspection: `SE UX_UI (1).zip` contains12 SVG exports; `(2).zip` contains12 matching PNG exports. Whole Auth/Landing board23328×20860 required scoped inspection; SVG text was outlined. Live Figma resolves properties that exports could not supply. No attachments were overwritten.

## Current frontend evidence

Paths below are relative to workspace root; line numbers refer to inspected commit in runtime-observations.json.

| File / line                                                                       | Confirmed fact                                                                                     |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `cu-ways-frontend/src/features/marketers/components/marketer-navigation.tsx:10`   | Overview/Services/Invitations/Profile only; detail active state currently uses final path segment. |
| `cu-ways-frontend/src/app/(app)/jobs/page.tsx:3`, `jobs/[id]/page.tsx:3`          | Generic jobs routes are placeholders.                                                              |
| `cu-ways-frontend/src/app/(marketer)/marketer/invitations/page.tsx:1`             | Live Invitations explicitly unavailable despite newer generated backend contracts.                 |
| `cu-ways-frontend/src/lib/api/generated/backend.ts:472`                           | Creator hiring and marketer request paths exist; no Start operation found.                         |
| `cu-ways-frontend/src/features/job-invitations/components/request-dialog.tsx:33`  | Accepting request says marketer has not been hired yet.                                            |
| `cu-ways-frontend/src/features/job-invitations/components/confirmation.tsx:43`    | Existing modal pending-dismissal/focus pattern.                                                    |
| `cu-ways-frontend/src/features/marketers/marketer.css:1`,`:103`                   | Theme palettes, Inter, semantic action/info/success/error tokens.                                  |
| `cu-ways-frontend/src/features/marketers/marketer.css:198`,`:995`,`:1128`         | Fluid shell; bottom bar safe-area; desktop inline breakpoint1024.                                  |
| `cu-ways-frontend/src/components/layout/navigation-device.ts:5`                   | Phone/tablet classification comes from UA; narrow desktop is a separate shell case.                |
| `cu-ways-frontend/src/features/marketers/components/performance-dashboard.tsx:96` | Fictional Recent Jobs maps In Progress to caution/amber; a known visual divergence from Figma.     |
| `cu-ways-frontend/src/app/(marketer)/marketer/dashboard/page.tsx:25`              | Live dashboard does not supply recent-job history. Demo figures are not live job records.          |

Runtime: frontend started on3001 because3000 belonged to an unrelated project and was left untouched. `MARKETER_DEMO_ENABLED=true` was set only in the owned process environment. No .env files changed. Reviewed `/demo/marketer` and its Invitations view, not authenticated hired-job behavior.

Screenshots: [desktop invitations](current-desktop-invitations.png), [desktop confirmation](current-desktop-confirmation.png), [phone invitations](current-mobile-invitations.png), [phone confirmation](current-mobile-confirmation.png), [desktop overview](current-desktop-overview.png). They show current demo patterns only. Phone used390×844 and mobile UA; desktop1440×900. Existing dialog was opened and cancelled; no invitation was accepted or declined. Initial screenshot scaling was inconsistent; desktop evidence was recaptured after explicit viewport emulation. No app defect is inferred from that capture issue.

## Backend evidence

| File / line                                                                 | Confirmed fact                                                                                                  |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `cu-ways-backend/internal/core/domain/job.go:5`                             | Five lifecycle values; no job title or started_at field.                                                        |
| `cu-ways-backend/internal/handlers/http/marketer_job_request_handler.go:36` | Offer price is decimal string; delivery_date nullable date-only; marketer request context lacks selected offer. |
| `cu-ways-backend/internal/handlers/http/marketer_job_request_handler.go:61` | Marketer-scoped nested job/creator/survey/brief read shape.                                                     |
| `cu-ways-backend/internal/repositories/postgres/job_offer_repo.go:78`       | Hiring transaction locks job; Selected offer/job Accepted, competitors Rejected/Closed.                         |
| `cu-ways-backend/internal/services/job_offer_service.go:36`                 | Creator ownership/membership boundary for hiring.                                                               |
| `cu-ways-backend/internal/server/server.go:130`                             | Current job/request/offer routes; no start operation.                                                           |
| `cu-ways-backend/internal/middleware/auth.go:13`                            | 401 for absent/invalid JWT.                                                                                     |
| `cu-ways-backend/internal/platform/response/response.go:50`                 | Standard success/error envelopes.                                                                               |
| `cu-ways-backend/internal/services/auth_service.go:14`                      | Access tokens expire after one hour.                                                                            |

API launched with existing configuration and no migration/seeder command. `GET /healthz` and `/readyz` both200; bodies in runtime-observations.json. Docker PostgreSQL and pgAdmin were already running. Health/readiness prove process/database reachability only. No private rows, credentials, session tokens or normal-database mutations were inspected or saved.

## Tooling and proof limits

`node scripts/verify.mjs --doctor` found Node24.13.0,pnpm11.25.0,Go1.26.5,Git2.52.0 and frontend dependencies. No explicit test database was configured. No full/quick/runtime test profile was run because this work changes only planning artifacts; runtime inspection was scoped to design references. No authenticated Start, concurrency, transaction or persistence claim is made.

Four independent Luna/max investigations covered frontend, backend, edge cases and design alternatives. Root reconciled them with source and runtime observations. Fresh review lenses are recorded separately after artifact review.
