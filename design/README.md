# Sprint 3 design previews

Mobile first, connected HTML prototypes for Tim's UX/UI tasks in Sprint Backlog III. These follow [the current design guide](../design.md), particularly the invitations list, job details and offer form. Application code and backend behavior are unchanged.

## Open the previews

Chp's US025/026/027/028/034 handoff is available separately in [chp-sprint-iii/](chp-sprint-iii/EXPORT.md). Run `node design/chp-sprint-iii/serve.mjs --port 4188` from the repository and open `http://127.0.0.1:4188/`. Its shared theme, local scenario studios, design index and review evidence are reference material; they do not modify the application or these connected Tim previews.

From the frontend repository, run:

```powershell
node design/serve.mjs
```

Open [the payment preview](http://127.0.0.1:3113/design/us-029-payment-recording.html). The server binds only to this computer, serves only design files and existing brand assets, and needs no backend or credentials. Stop it with Ctrl+C. Set `DESIGN_PORT` if 3113 is occupied. Opening HTML files directly also works, but browser rules for local-file storage differ; use the server for the connected flow.

| Story | Preview                                         | Behavior and handoff                           |
| ----- | ----------------------------------------------- | ---------------------------------------------- |
| US029 | [Record payment](us-029-payment-recording.html) | [Payment guide](us-029-payment-recording.md)   |
| US032 | [Transactions](us-032-transaction-history.html) | [History guide](us-032-transaction-history.md) |
| US033 | [Submit review](us-033-submit-review.html)      | [Review guide](us-033-submit-review.md)        |

Each page has a collapsed **Prototype controls** panel below the product UI. It lets reviewers change scenarios, reset the fictional data or fail the next save. This panel is a design tool and must not ship in the product. It identifies the intended application route. The prototype filenames are not Next.js routes.

## Try the connected flow

1. Open US029 and reset all preview data. You are Alex Kim in the Creator workspace. Job #1042 is Accepted with an accepted offer for THB 2,500.00.
2. Choose a method, enter `2500`, review the confirmation, and confirm. Payment becomes Paid, payout becomes Held. A success toast slides down from the top.
3. Open Prototype controls and choose **Delivery submitted**. This simulates the Marketer's separate start and delivery actions. It preserves the saved payment method, amount and recorded timestamp.
4. Open delivery proof, then choose **Complete job** and confirm. Completion and the simulated payout release happen together.
5. Follow **Transactions**. Job #1042 now appears in history. Its **Write a review** link opens US033 for the same job.
6. Choose 1 to 5 stars, optionally write a comment, check the confirmation and submit. The saved review replaces the form. Reloading does not replay a toast or allow another review.

The default US033 entry opens a separate completed job #1038, so its form can also be reviewed independently. Cross-page links retain their job identifier. The payment HTML also contains a small `?job=1042&view=job` context preview for testing back navigation. This is not a replacement design for the existing full job-details page.

## Agreed payment behavior

- This is record keeping. There is no payment gateway, card collection, QR payment, real escrow, bank transfer or actual payout.
- At job start, the owning Creator records the payment using PromptPay, Bank Transfer or Credit Card. The amount must exactly match the accepted offer price.
- The incoming payment record is **Paid**, with its recorded timestamp. The separate Marketer payout state is **Held**.
- Recording payment does not silently start the job. The Marketer's start action belongs to US025. Work and proof submission belong to the adjacent job flow.
- Completion needs In Progress, an Accepted offer for this job, Paid payment of the agreed amount, and delivery proof. The Creator reviews the proof and confirms completion.
- Completion records the payout as **Released**. The amount released is the accepted price, with no invented fees or deductions.
- Completed jobs appear in transaction history for the involved Creator and Marketer. Only the owning Creator can submit one review per completed job.

Paid follows the backlog's payment-record vocabulary. Held and Released, and automatic release on Creator completion, are the behavior agreed in this conversation. They are additional design requirements, not claims about existing backend support. They must be coordinated with US025 to US031 before implementation. Cancellation, disputes, refunds and partial payouts are outside these three previews; no policy is implied for those cases.

## Shared visual and interaction rules

- `shared.css` mirrors the current workspace tokens, Inter font, 80px header, mobile gutters, 16px cards, subtle shared shadow, 48px fields and buttons, plain back arrow, white searches, light and dark themes, and hamburger navigation. There is no floating bottom navigation.
- Pending and Held use caution text. Accepted, Completed, Paid and Released use positive text. In Progress uses blue text. Failed and Cancelled use error text. Statuses have no shape, fill, border, padding or decorative dot.
- `shared.js` shares the shell, confirmation dialog, toast, fixtures and interactions. Success appears once, slides from the top, dismisses after five seconds, pauses while hovered or focused, and respects reduced motion.
- Native dialogs trap focus, support Escape before saving, retain form values on cancel/failure, and block duplicate confirmation while saving. Focus returns to the trigger after cancel, or to the updated main content after success.
- The actual logo comes from `public/marketer-assets`. Role bird SVGs were extracted from the current `MarketerRoleBirds` artwork without redrawing it. The Inter Latin font is copied from the existing application build, with its [license](assets/OFL.txt). No CDN is needed.
- All amounts use THB with two decimals. Dates use the Bangkok timezone. All people, jobs and transactions in the previews are fictional. Proof links deliberately open an example page.
- Browser storage uses isolated `cuways-sprint3-design-*` keys. It does not read authentication, modify real accounts or call APIs. Browser restrictions can make preview state session-only. Reset clears only preview data and keeps the selected theme.

## Developer handoff

Use the real CreatorShell or MarketerShell and the existing Button, Input, SearchField, BackLink, StatusText and SuccessToast components when implementing. Do not paste this demo state management into production. Extend the shared status mapping for Held and Released once the backend contract is agreed.

Tim's US029 tasks are the payment page, method selection, amount validation and confirmation. US032 covers the history page, financial breakdown and empty state. US033 covers the review form, 1 to 5 stars, optional comment and submission confirmation.

Coordinate with Chp on the job-details entry points, job start, delivery proof, completion confirmation and public review display. No additional visual design is required to review these prototypes. Production still needs an agreed backend representation for held and released records, timestamps, authorization, atomic completion/release and duplicate prevention. The root backlog remains provisional; this folder is a design handoff, not an API contract.

Run `node --check design/shared.js`, `node --check design/serve.mjs`, and `pnpm exec prettier design --check` for static checks. Review mobile widths 320, 375 and 430, a wider layout, both themes, keyboard navigation, empty/error states and the connected flow in a browser.
