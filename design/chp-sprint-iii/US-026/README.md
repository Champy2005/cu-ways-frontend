# US-026 · Proof of delivery

[Studio](demo/index.html) · [Product screen](demo/screen.html) · [Canonical scenarios](model/scenarios.json)

The active HTML handoff uses shared theme 1.9.1 and 14 states: A01–A06, B01–B04 and C01–C04. See [demo controls](demo/README.md) and [export instructions](../EXPORT.md). Historical SVG boards, Figma-import instructions and screenshot evidence are excluded; their originals remain in the separate workspace.

## Requirements and integration

Chp owns the upload section, saved URL/timestamp list and invalid attachment-type alert. Source: Project Backlog row 27 and Sprint Backlog III rows 28–38 in Backlog (3).xlsx. This is a proof-link submission design; binary uploads, file extensions, editing/deletion and job completion are outside its scope.

- Permit an authorized marketer to submit a delivery URL only while the job is In Progress. The form supplies attachment type Proof; Brief and Other do not count as proof.
- Trim surrounding whitespace and accept full HTTP(S) URLs. Syntax validation does not establish remote existence, access or safety. Preserve the draft on rejection.
- Save success requires an authoritative response. Show the saved URL and server timestamp, newest first; clear the draft only after confirmation. Long URLs wrap. Links open separately with an external-link cue.
- Convert server instants into the viewer's timezone and label it. The demo's ICT dates are fictional fixtures.
- Prevent duplicate submission while pending. Dismissing pending presentation does not cancel a dispatched save.
- Unknown outcomes retain the URL and require a read of saved proof before retry. A failed reconciliation stays unknown. Production identity/idempotency must handle concurrency and legitimate repeated URLs; URL equality alone is insufficient.
- Initial loading, failed list reads and genuine empty lists are distinct. A status change removes the form; lost access removes private job metadata, URLs and draft content.
- Proof submission leaves the job In Progress. US027/US031 own completion prerequisites; US028 owns cancellation.

The previously inspected Attachment domain includes Brief/Proof/Other, URL and upload_at fields. No agreed proof-submission endpoint was established by this design. Reinspect current OpenAPI and both application repositories before adoption; do not infer request routes, pagination, identities or error codes from mock requests.

## Composition and accessibility

The compact Add proof entry opens an inline form above the saved list. Shared recipes own action/feedback appearance; story CSS owns content layout. Labels, helper/error associations, invalid-input focus and live announcements belong to the form. Keyboard/focus restoration, short layouts, long URLs, enlarged text, reduced motion and opaque fallbacks are available in the studio.

The demo makes no product API calls and does not prove authentication, authorization, persistence or concurrency. Human palette and complete-page acceptance remain pending. Current guidance is in the [principles](../book/PRINCIPLES.md) and [decision records](../book/README.md).
