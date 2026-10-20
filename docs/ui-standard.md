# Workspace UI standard

Use the saved job details and Marketer offer form as the reference for workspace pages.

- Use the shared workspace logo, Inter font, role switch, theme toggle, and navigation. Creator destinations are Overview, My jobs, Surveys, Discover, and Settings. Marketer destinations are Overview, Services, Invitations, My offers, and Profile.
- Keep forms and job details compact, normally `max-w-md`. Lists and comparisons can use wider responsive grids. Use an 18–20px bold page heading, a smaller muted description, and one consistent back control.
- Use workspace color variables in both themes. Cards have rounded corners, a subtle border and shadow. Fields have a soft background. Pink indicates the primary action; red is reserved for destructive actions.
- Every visible action must work. Navigation should carry the current job forward. `/jobs` redirects to My jobs; `/dashboard` restores the workspace choice for that signed-in user, or selects the available Marketer workspace before falling back to Creator.
- Successful actions use `SuccessToast`: a fixed, centered toast slides down from the top of the viewport. It announces politely, dismisses after five seconds, pauses on hover or keyboard focus, and honors reduced motion. Validation and actionable failures stay near the relevant control. Persistent information such as the hired marketer is a normal card, not a repeated success notice.
- Saved state comes from the backend. Opening or reloading an accepted job must not announce a new acceptance. URL preview flags never override real job status.

Job titles, descriptions, numeric compensation in THB, and job deadlines persist alongside survey links. Edits save the metadata and complete survey selection atomically while the job is Pending. The effective delivery deadline is the earlier of the saved job deadline and all linked survey deadlines, and is shown to both parties. Legacy jobs may have unspecified details; an old tab cache is not treated as a saved backend record.

Discovery uses pagination. Marketer details and public service catalogs use the direct authenticated marketer-by-ID endpoint rather than approximating profiles from a search page.
