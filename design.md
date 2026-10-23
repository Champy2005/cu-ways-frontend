# CU Ways design guide

Use this guide when designing or implementing Sprint 3 screens. New screens should feel like part of the current CU Ways mobile application, with the same controls, spacing, colors, navigation, and feedback.

This guide records the design decisions agreed during the Sprint 2 review, including the final registration and status-text changes. It covers visual and interaction design. Feature requirements, permissions, and API behavior belong in the project requirements and implementation documentation.

## 1. Start from the approved references

| Reference screen                        | Reuse its patterns for                                                                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `/marketer/invitations`                 | Main visual reference: page headings, white search surface, tabs, list cards, spacing, and action placement        |
| `/creator/jobs/{id}`                    | Compact detail pages, grouped information, subtle card shadows, contextual action hierarchy, and progress tracking |
| `/marketer/offer/create?requestId={id}` | Form layout, job context, field grouping, validation, and saved offer presentation                                 |
| `/creator/jobs`                         | Full-width mobile create action, whole-card navigation, and pending-offer counts                                   |
| `/register`                             | Registration width, consistent field alignment across steps, readable fields, and balanced buttons                 |

Use real records to inspect authenticated screens. A reference route is a layout example, not a requirement to duplicate its content on unrelated pages. Older demos, unused styles, and isolated variations do not override the decisions below.

The shorter [workspace UI standard](docs/ui-standard.md) is a quick reference. Keep it aligned with this guide when a design decision changes.

## 2. Decisions to preserve

- Design for mobile first. Check 320px, 375px, and 430px widths before widening the layout for desktop.
- Use the existing Creator or Marketer shell. Mobile navigation comes from the hamburger menu. Do not add a floating bottom navigation bar.
- Use pink for the main action and give supporting actions less visual emphasis.
- Display statuses as colored text only. Do not put statuses in pills, badges, outlined containers, or tinted backgrounds.
- Use the shared search field, with a white surface in light mode and the corresponding surface in dark mode.
- Use a plain back arrow with a usable touch area. Do not draw a permanent circle or border around it.
- Success messages slide down from the top of the screen using the shared toast.
- Use consistent card shadows. A project brief card should not look more elevated than neighboring cards.
- Keep registration wide enough to use the available mobile space, with 16px screen margins.
- Do not use em dashes in UI copy, labels, messages, placeholders, or design handoff text.

Consistency means repeated controls behave and look the same. A form, dashboard, and detail page can still have different layouts.

## 3. Layout, spacing, and type

### Page frame

Workspace screens inherit `.mk-frame`, `.mk-main`, and `--mk-gutter` from the shell. Align the heading, search field, cards, and full-width actions to that frame. Do not add another layer of horizontal page padding that squeezes the content.

The current workspace gutter is `clamp(1.5rem, 4vw, 8rem)`, with a 16px gutter below 360px. Registration has its own 16px screen gutters. Reuse these contexts rather than assigning a new margin to each page.

| Context                            | Width pattern                                                                                              |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Mobile lists                       | One column using the available frame width                                                                 |
| Compact job details and forms      | Centered `w-full max-w-md`, normally 448px maximum                                                         |
| Registration                       | `w-full max-w-lg`, normally 512px maximum; the account step can use the existing two-column desktop layout |
| Wider lists and comparison screens | Reuse the relevant existing grid; Invitations and My offers share `.ji-page` and `.ji-grid`                |

Search fields and list cards should have matching outside edges on mobile. Give grid children `min-w-0` when long content could widen a column. Wrap long titles, descriptions, and links without creating page-level horizontal scrolling.

Expand into columns only when the content has enough space. Keep the same reading order, actions, and information on wider screens.

### Spacing and shape

Use the existing spacing rhythm: 4px, 8px, 12px, 16px, 20px, 24px, and 32px. These are layout guidelines, not new CSS tokens.

- Use 8px to 12px between closely related controls or pieces of metadata.
- Use 16px to 20px inside ordinary list and detail cards.
- Use 16px to 24px between cards or related sections, and 24px to 32px between larger groups.
- Registration uses 16px inner horizontal padding and 24px bottom padding on each step. Fields and actions share the same edges.
- Reuse the existing radius for the component: `.ji-card` uses 16px, `.mk-card` uses 20px, workspace action buttons use 14px, and `SearchField` uses `0.85rem`.
- Keep cards in the same group on the same border, radius, and shadow treatment. Use `--mk-shadow` for normal card elevation and `--mk-shadow-hover` for an existing interactive hover treatment.

Do not copy a modal shadow onto an ordinary content card. Modal elevation is stronger because it sits above the page.

### Typography

Use Inter in the workspace and authentication screens. Inherit it from the existing layouts rather than loading a different font for a feature.

| Text role                    | Mobile guidance                                                    |
| ---------------------------- | ------------------------------------------------------------------ |
| List or workspace page title | Follow the existing heading component, normally about 20px to 26px |
| Compact detail or form title | 18px to 20px, bold                                                 |
| Card or section heading      | 16px to 18px, semibold or bold                                     |
| Body text                    | 14px to 16px with comfortable line height                          |
| Metadata and status text     | Normally 12px, readable and secondary in emphasis                  |
| Input text                   | 16px on mobile                                                     |
| Button label                 | Normally 14px to 16px, medium or semibold                          |

Authentication has its own larger introductory headings, currently around 24px to 32px. Preserve that hierarchy without applying the larger size to workspace detail pages.

Use sentence case for new headings and actions. Keep secondary descriptions muted, but make labels and important values easy to read. Do not shrink text to make a layout fit.

## 4. Color and themes

The workspace color source is [marketer.css](src/features/marketers/marketer.css). Both roles share these tokens despite the stylesheet name.

| Purpose                           | Token                 | Light     | Dark      |
| --------------------------------- | --------------------- | --------- | --------- |
| Page canvas                       | `--mk-bg`             | `#f4f5f6` | `#111416` |
| Card and search surface           | `--mk-surface`        | `#ffffff` | `#1a1e21` |
| Raised surface                    | `--mk-surface-raised` | `#ffffff` | `#22282c` |
| Recessed field or grouped surface | `--mk-field`          | `#f7f7f8` | `#242a2e` |
| Hover surface                     | `--mk-hover`          | `#e5eaec` | `#2b3337` |
| Main text                         | `--mk-text`           | `#1d2226` | `#f2f4f5` |
| Secondary text                    | `--mk-muted`          | `#657078` | `#a4adb2` |
| Borders                           | `--mk-border`         | `#d9dfe2` | `#333b40` |
| Pink text accent                  | `--mk-accent`         | `#c51f5d` | `#f36a9e` |
| Primary button fill               | `--mk-action`         | `#c1225d` | `#d93673` |
| Primary button hover              | `--mk-action-hover`   | `#a91b4f` | `#ed4c86` |
| Blue information or progress      | `--mk-secondary`      | `#197f9f` | `#5fc7e5` |
| Positive state                    | `--mk-positive`       | `#26844c` | `#62cd83` |
| Pending or caution text           | `--mk-caution`        | `#806000` | `#f5d45c` |
| Error or destructive text         | `--mk-error`          | `#b42318` | `#fda29b` |

Use the token in code instead of copying its hex value into a new component. The palette above is useful for design files; the stylesheet remains the implementation source for the actual values.

Pink action fills and pink text accents have separate tokens. Use `--mk-action` for a filled primary button with white text. Use `--mk-accent` for accent text, active tabs, and focus treatments. Do not use the brighter dark-theme accent as an arbitrary filled button background.

The authentication screens retain their existing `--login-*` and `--rg-*` palettes. Extend those existing styles for authentication work; use the workspace palette for new workspace features.

`MarketerTheme` follows the system preference until the user selects a theme. Preserve that selection across routes. Check actual light and dark surfaces, borders, disabled controls, status text, and focus states. Do not simulate dark mode by inverting the light design.

## 5. Navigation and page structure

Use [CreatorShell](src/features/creators/components/creator-shell.tsx) or [MarketerShell](src/features/marketers/components/marketer-shell.tsx). The shell owns the logo, sticky header, theme toggle, role switch, menu, skip link, and page frame. A feature page should not render another shell or another global header.

| Workspace | Main destinations                                   |
| --------- | --------------------------------------------------- |
| Creator   | Overview, My jobs, Surveys, Discover, Settings      |
| Marketer  | Overview, Services, Invitations, My offers, Profile |

The hamburger includes navigation and sign out, marks the current destination, and closes after selection. Existing desktop navigation can remain visible where space permits. Check the mobile header with a real mobile user agent as well as a narrow desktop viewport, because the shell uses device detection.

Start a normal workspace page with a heading and a short supporting description when useful. Add a back control for nested flows. Use [BackLink](src/components/ui/back-link.tsx) for a known parent route and a ghost icon button for an action such as returning to a form step. Keep a minimum 44px touch area and a specific accessible label such as "Back to job details".

Back navigation should return to the relevant parent and preserve context, such as the current job. Do not add a navigation button for the page the user is already on.

A fixed bottom action area can support a task, such as reviewing selected marketers. It is not global navigation. Include safe-area spacing and enough content padding so the final card and controls remain reachable above it.

## 6. Shared controls and content patterns

### Buttons and action hierarchy

- Use `Button` for actions and a link for navigation. A navigation link can use the existing button styling.
- Give each task group one clear primary action. Use `.mk-primary-button` for the pink treatment and `.mk-secondary-button` or an outline button for supporting actions. Use a quiet ghost or outline treatment for lower-priority editing controls.
- Mobile create and submit actions should normally fill their content column and be about 48px high. Keep text fields and buttons balanced in height and text size.
- Reserve red for destructive or negative actions. Do not assign random colors to distinguish neighboring buttons.
- Use action labels that state what will happen: "Create a job", "Save changes", "View offers", and "Review & Send".
- Show a pending label, disable duplicate submission, and retain clear feedback while an action is running.
- Compact button variants exist, but avoid using a small visual control as the only touch target on mobile.

The current job-detail hierarchy is contextual. For a Pending job with no pending offers, "Invite marketers" is primary, "View offers" is secondary, and "Edit" is quiet. When offers need review, "View offers" becomes primary. Invitation actions are unavailable once the job is no longer Pending.

### Fields and search

Use [Input](src/components/ui/input.tsx), the existing select and textarea primitives, and the feature's established field/error components. Reuse [SearchField](src/components/ui/search-field.tsx) for searches.

- Default mobile fields and searches are 48px high, with 16px input text.
- Use the surface background, a subtle border, and a visible focus treatment. Search is white in light mode and uses the corresponding surface in dark mode.
- Search uses the existing right-aligned search icon and a meaningful accessible label. A placeholder is a hint, not the only label for a normal form field.
- Keep fields full-width within the form and align them with the submit action. Avoid nested side padding that makes each field narrower than its card needs.
- Keep registration's account, contact, and experience steps aligned to the same mobile width.
- Put validation beside the relevant field in normal document flow. Allow errors to wrap and increase the page height instead of overlapping the next control.
- Retain entered values after a failed save and provide a clear way to retry.

### Cards, lists, tabs, and filters

Use the invitations card layout for similar lists. Put identity or title first, status near the top, supporting information underneath, and actions in a predictable place.

Job cards are a single link to job details. Keep Edit, View offers, and Invite marketers on the detail page. Show pending-offer counts on the list so creators can see when a decision is waiting. Do not put nested action links inside a card that is already one link.

Use the existing line tabs for status views: an accent label and underline for the active tab, muted inactive labels, and a subtle baseline. Long tab rows can scroll horizontally without making the whole page scroll sideways. Counts must describe the current data accurately.

Rounded filter chips and topic tags can still be used for selection and categorization. They are different from status labels. Keep selected filters, removable filters, and plain statuses visually distinguishable.

### Status text

Use [StatusText](src/components/ui/status-text.tsx) everywhere a job, invitation, offer, service, or performance item displays a status.

| Status                         | Meaning color | Token            |
| ------------------------------ | ------------- | ---------------- |
| Pending                        | Yellow        | `--mk-caution`   |
| Accepted, Completed, Published | Green         | `--mk-positive`  |
| In Progress                    | Blue          | `--mk-secondary` |
| Rejected, Declined, Cancelled  | Red           | `--mk-error`     |
| Withdrawn, Closed              | Neutral       | `--mk-muted`     |

Render only the colored words, with no surrounding fill, border, rounded shape, badge padding, or decorative status dot. Use wording that identifies the subject when needed, such as "Invitation accepted" or "Offer pending review". The words must remain understandable without seeing the color.

For a new Sprint 3 status, agree on its meaning and add it to the shared mapping and this guide. Do not silently give the same status a different color on another page.

### Icons and brand assets

Use the existing Lucide outline icon style. Icons alongside controls are normally 16px to 20px; the main hamburger is larger. Hide decorative icons from assistive technology and label icon-only controls.

Reuse `MarketerLogo`, the role picker, theme toggle, and existing SVG assets under [public/marketer-assets](public/marketer-assets) and [public/register](public/register). Preserve the light and dark logo variants and the existing Creator pink and Marketer blue mascot identities. Do not redraw the logo, add a new mascot style, or use emoji as interface icons.

## 7. Feedback, dialogs, and copy

### Success feedback

Use [SuccessToast](src/components/feedback/success-toast.tsx) after a confirmed successful action.

- The toast is fixed at the top, centered, and slides down from above the screen.
- It uses the surface background, a positive border and icon, and readable text. It appears above the header without shifting the page layout.
- The current width is at most 448px, with 16px viewport clearance. Its top position respects the safe area.
- It dismisses after five seconds, pauses while hovered or focused, and has a dismiss control.
- It announces success politely and honors reduced motion. The existing entry and exit timing are 220ms and 180ms.
- Show it once for the action. Reloading or reopening an already-saved record must not replay a success message.

Persistent information belongs in the page, such as a hired marketer or a saved offer's status. A toast should not be the only place an important result can be found later.

### Errors, loading, empty states, and dialogs

Validation belongs beside its field. An action or loading failure should explain what happened and offer the relevant recovery action, such as "Try again", "Refresh offers", or "Sign in again". Use an alert for actionable errors; do not show failures with the success treatment.

Loading states should preserve the page's structure where practical. Distinguish an empty collection from a failed request and from a search with no matches. Give the empty state one useful next step, such as creating the first item or clearing the search.

Reuse the Base UI dialog or alert-dialog components for editing, discarding changes, and consequential confirmations. Match the existing themed surface, border, rounded corners, and backdrop. Keep the title, result of the action, primary action, and cancel action clear. Dialogs must fit the mobile viewport, scroll when necessary, support keyboard navigation, and return focus to the trigger when closed.

### Product language

Use short, direct sentences and the established terms: Creator, Marketer, job, survey, invitation, offer, and service. Keep raw API codes, internal IDs used only for debugging, and implementation details out of the normal user flow.

Do not use em dashes. Use a period, comma, colon, or parentheses as appropriate. Use "Not specified" for missing profile information instead of a dash placeholder. Keep unavailable data distinct from a real zero.

Show money with a clear THB unit and follow the existing price formatters. Make date-only delivery dates and timestamp-based events clear, and follow the feature's existing timezone formatter. Do not invent a new currency or date style for one screen.

## 8. Reuse map for implementation

| Need                                        | Start here                                                                                                                                                                                                     |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Creator workspace frame                     | [creator-shell.tsx](src/features/creators/components/creator-shell.tsx)                                                                                                                                        |
| Marketer workspace frame and shared theme   | [marketer-shell.tsx](src/features/marketers/components/marketer-shell.tsx), [marketer-theme.tsx](src/features/marketers/components/marketer-theme.tsx)                                                         |
| Colors, cards, menu, and workspace controls | [marketer.css](src/features/marketers/marketer.css)                                                                                                                                                            |
| Invitations and offers visual patterns      | [invitations.css](src/features/job-invitations/invitations.css), [live invitations](src/features/job-invitations/live/invitations-page.tsx), [My offers](src/features/job-invitations/live/my-offers-page.tsx) |
| Buttons, fields, tabs, dialogs, and selects | [src/components/ui](src/components/ui)                                                                                                                                                                         |
| Search, back navigation, and statuses       | [search-field.tsx](src/components/ui/search-field.tsx), [back-link.tsx](src/components/ui/back-link.tsx), [status-text.tsx](src/components/ui/status-text.tsx)                                                 |
| Success notification behavior and motion    | [success-toast.tsx](src/components/feedback/success-toast.tsx), [globals.css](src/app/globals.css)                                                                                                             |
| Registration layout and field styling       | [register-wizard.tsx](src/features/auth/components/register/register-wizard.tsx), [register.css](src/features/auth/register.css)                                                                               |
| Login styling                               | [login.css](src/features/auth/login.css)                                                                                                                                                                       |

Extend an existing shared component when the same change belongs across features. Keep feature-specific layout and business behavior inside the feature. The presence of a base primitive does not mean its smallest size or every color variant is appropriate for the mobile workspace.

## 9. Sprint 3 design handoff and review

For each new flow, include the starting point, destination, back behavior, main action, and the state after completion. Show how the design responds to loading, validation, failure, empty data, success, and any permission or status that changes the available actions.

Provide mobile layouts first, plus light and dark workspace states. Include a wider layout when the flow changes into columns or a comparison view. Name the existing component and token used for repeated controls so implementation does not depend on guessing from screenshots.

Before accepting a design or implementation, check:

- [ ] The screen follows the relevant approved reference and uses the correct shell.
- [ ] It works at 320px, 375px, and 430px, with no unintended horizontal page scrolling.
- [ ] Search, cards, fields, and primary actions align to the page or form frame.
- [ ] Registration keeps its 16px mobile screen margins and consistent inner padding.
- [ ] The main action is obvious; supporting actions have a clear hierarchy.
- [ ] Statuses use the shared colors and plain text presentation.
- [ ] Navigation comes from the hamburger on mobile; the back arrow has no permanent circle or border.
- [ ] Fixed controls and the on-screen keyboard do not hide the final fields or actions.
- [ ] Long titles, names, amounts, URLs, and error messages wrap or truncate deliberately.
- [ ] Light and dark themes, focus, disabled states, and minimum 44px touch areas remain usable.
- [ ] Every visible action works and preserves the correct record or flow context.
- [ ] Success uses the top-slide toast once; loading, empty, and error states are clear.
- [ ] UI text contains no em dashes and missing information is labeled clearly.

Use [the verification guide](docs/verification.md) for the repository's checks. Visual changes need a real browser review as well as any relevant automated checks. Check mobile user-agent behavior, keyboard focus, and reduced motion when those behaviors are affected.
