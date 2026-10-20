# Workspace UI standard

Use `/marketer/invitations` as the main mobile visual reference. Saved job details and the Marketer offer form provide patterns for their specific flows.

- Use the shared workspace logo, Inter font, role switch, theme toggle, and navigation. Creator destinations are Overview, My jobs, Surveys, Discover, and Settings. Marketer destinations are Overview, Services, Invitations, My offers, and Profile.
- Keep forms and job details compact, normally `max-w-md`. Lists and comparisons can use wider responsive grids. Use an 18–20px bold page heading, a smaller muted description, and one consistent back control.
- Use workspace color variables in both themes. Cards have rounded corners, a subtle border and shadow. Fields and searches use the surface background (white in light mode). Shared `SearchField`, `StatusText`, `BackLink`, `Input`, and `Button` components define repeated controls. Default fields and primary buttons are 48px high; text is readable on mobile. Pink indicates the primary action; red is reserved for destructive actions.
- Mobile navigation comes from the hamburger menu, which marks the current destination. Do not add a floating bottom navigation bar.
- Job cards open their details as one link. Display the backend pending-offer count; keep Edit, View offers, and Invite marketers on the details page. Invite marketers is primary until pending offers need review, when View offers becomes primary.
- Status colors keep their meaning across jobs, invitations, and offers: Pending yellow, Accepted/Completed green, In Progress blue, Rejected/Declined/Cancelled red, and Withdrawn/Closed neutral. Statuses are colored text only, with no background, border, rounded container, or badge padding. Labels identify what the status refers to.
- Every visible action must work. Navigation should carry the current job forward. `/` directs signed-out visitors to sign-in and signed-in visitors to their workspace; `/jobs` redirects to My jobs; `/dashboard` restores the workspace choice for that signed-in user, or selects the available Marketer workspace before falling back to Creator.
- Successful actions use `SuccessToast`: a fixed, centered toast slides down from the top of the viewport. It announces politely, dismisses after five seconds, pauses on hover or keyboard focus, and honors reduced motion. Validation and actionable failures stay near the relevant control. Persistent information such as the hired marketer is a normal card, not a repeated success notice.
- Saved state comes from the backend. Opening or reloading an accepted job must not announce a new acceptance. URL preview flags never override real job status.

Job titles, descriptions, numeric compensation in THB, and job deadlines persist alongside survey links. Edits save the metadata and complete survey selection atomically while the job is Pending. The effective delivery deadline is the earlier of the saved job deadline and all linked survey deadlines, and is shown to both parties. Legacy jobs may have unspecified details; an old tab cache is not treated as a saved backend record.

Discovery uses pagination. Marketer details and public service catalogs use the direct authenticated marketer-by-ID endpoint rather than approximating profiles from a search page.

Registration uses the available mobile width with 16px screen gutters and consistent inner padding on every step. Keep a sensible maximum width on larger screens. Use ordinary punctuation in UI copy; do not use em dashes. Missing profile values read "Not specified".
