# Project brief API integration

The project brief section on `/creator/jobs/[id]` uses the existing authenticated server API client through `src/features/jobs/brief-actions.ts`:

- `GET /api/v1/jobs/{id}/briefs` loads the current brief and history. The backend supplies newest-first ordering; the first entry is current. Only an empty successful response shows the empty state.
- `POST /api/v1/jobs/{id}/briefs` sends `{ "url": "https://…" }` to append a version. The returned attachment immediately becomes current in component state, preserving the previous versions. IDs and timestamps come from the backend. The success notification follows a confirmed POST; saving does not refetch history, refresh the route, or reload the page.

The server actions require a session and validate job IDs and HTTP(S) URLs. Backend authorization remains authoritative. Loading, authorization errors, invalid data, and failed requests have separate UI feedback. The form keeps its values on rejection and blocks duplicate submissions while saving. An uncertain POST requires a history reload before another save.

## Existing contract limitations

`Brief` contains `attachment_id`, `attachment_type`, `url`, and `upload_at`. It has no title/note or editor identity field, and `CreateBriefRequest` accepts only `url`.

The optional title/note and editor-name snapshot remain in browser-tab storage, scoped by creator and job. They are used only when a backend record matches its ID, URL, and timestamp. Older UI-only attachments are not uploaded or treated as persisted history. On another device/tab, titles fall back to “Project brief.” Editor labels fall back to the signed-in owner's username because the backend restricts both endpoints to the job owner; a historical username is unavailable without additional backend fields.

No backend source, schema, or generated API types were changed for this integration.

## Verification

`brief-actions.test.ts` checks the endpoint paths and payloads, authentication, response validation, error handling, server ordering, and saves without follow-up reads. `job-project-brief.test.tsx` checks the rendered API states, immediate updates, history, metadata matching, pending submissions, retry behavior, and stale responses. The job page and survey workflow tests mock these actions to retain coverage of their existing flows. These tests use mocked API responses and do not write to a live backend.
