# Sprint 2: software demo practice

Allow about 12–15 minutes. Use three parts: account → job → offers/hiring.
Your only narration needs to be “I do this” followed by pointing to the result.

## Prepare before practicing

1. Start the existing database and apply the backend migrations. In a backend terminal:

   ```powershell
   cd C:\Users\timap\Desktop\Tim\CU\Year3\SE\project\cu-ways-backend
   docker compose up -d --build
   make migrate-up
   make run
   ```

   Keep your existing `.env`. For first-time setup, follow the backend README.

2. In a frontend terminal, prepare a fresh rehearsal:

   ```powershell
   cd C:\Users\timap\Desktop\Tim\CU\Year3\SE\project\cu-ways-frontend
   pnpm setup:sprint2
   pnpm dev
   ```

   Keep the backend terminal running. If the frontend is already running, use a separate
   terminal for setup; do not launch a second frontend. Use the same frontend origin throughout.
   The defaults are backend `http://127.0.0.1:8081`, frontend `http://localhost:3000`.
   If needed, set `BACKEND_API_URL` and `FRONTEND_ORIGIN` in the setup terminal to your
   actual loopback origins. Match the frontend server's own configuration too.
   Open `/login` on the real frontend; do not use `/demo/marketer`.

3. Open the generated `practice-card.md` and `accounts-and-scenarios.json` at the paths
   printed by setup. The JSON has synthetic logins and an unused account for live registration.
   Keep credentials in private notes, off the projected screen. Never commit that folder.

4. Open three independent browser profiles/windows: **Creator**, **Marketer A**, **Marketer B**.
   Different browsers also work. Ordinary tabs share the session cookie; multiple private
   windows in the same browser may share it too. Sign in A and B ahead of time and bookmark
   `/marketer/invitations` and `/marketer/offers`. Sign in shortly before presenting because
   sessions last one hour. Login may land on the Creator dashboard; open the bookmarked
   Marketer URL after signing in.

5. Confirm the two brief URLs on the practice card open and show different text. The sample
   survey URL is explicitly a placeholder; no questionnaire or response collection is demonstrated.

Setup creates a Creator, two Marketers with services, an empty-inbox Marketer, four survey
records, a separate decline invitation, and a backup hiring job. B has already offered
1500.00 on that backup job; A has not responded. The live job you create below starts fresh.
All newly created marketers show **No ratings yet**. No review history is fabricated.

Every setup run uses new accounts, future deadlines, and new records. Existing data is
preserved. There is no database reset. After a failed setup, its credential file records
any accounts created so far; fix the backend issue and run again for a new rehearsal.

## Part 1 — Account (about 3 minutes)

Use the Creator browser. The JSON's `registration` account has NOT been created.

| Step | Action                                                                                                                                                      | Pause and show                                                                              |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1    | Open `/register`. Use first name `Sprint2`, last name `Presenter`; copy the unused registration email/password. Select Creator and both consents. Continue. | The contact step opens.                                                                     |
| 2    | Enter its phone and LINE ID, confirm registration, and continue through the success screen.                                                                 | Registration succeeds and the Creator workspace opens.                                      |
| 3    | Log out. On `/login`, enter the same email with an incorrect password.                                                                                      | Login error; access is not granted.                                                         |
| 4    | Enter the correct password and log in.                                                                                                                      | The account can sign in again.                                                              |
| 5    | Open `/creator/settings`, change LINE ID to `sprint2-presenter`, save, then reload.                                                                         | The saved contact value remains.                                                            |
| 6    | Replace the phone with the seeded Creator's phone from the private JSON. Save.                                                                              | Duplicate phone error. Restore the registration account's original phone before continuing. |
| 7    | Log out. Try registering with the seeded Creator's existing email, an otherwise valid form, and the registration phone.                                     | Duplicate email error. This is an attempted duplicate, not another successful account.      |
| 8    | Open `/login` and sign in using the seeded `creator` account.                                                                                               | You are ready to use its prepared surveys.                                                  |

Say only: “Registration, login, saved contact details, and duplicate checks.”

The seeded Creator is a separate account with survey prerequisites, so do not expect the
fresh registration account to have those surveys. Keep a valid 10-digit phone throughout:
the current implementation requires it, although the backlog's nullable-phone criteria differ.
Do not claim that criterion is complete. To demonstrate Marketer registration as well,
use another unused email and phone, select Marketer, and complete the extra profile step;
this is optional additional time rather than a requirement for this walkthrough.

## Part 2 — Job setup (about 4 minutes)

Stay signed in as the seeded Creator.

| Step | Action                                                                                                                                                                                                               | Pause and show                                                                 |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1    | Open `/creator/jobs/create`. Enter title `Campus dining campaign`, description `Reach 50 CU students`, compensation `2000`, and the job deadline from the practice card. Attempt creation without selecting surveys. | Survey selection validation; no job is created.                                |
| 2    | Select **Campus dining survey**, save the selection, then create the job.                                                                                                                                            | A real Job ID and **Pending** status. Write down this **live Job ID**.         |
| 3    | Add **Campus transport survey** under linked surveys; save. Reload.                                                                                                                                                  | Two saved survey links.                                                        |
| 4    | Remove transport and confirm. Attempt to remove dining.                                                                                                                                                              | One link remains; the last-survey rule blocks removal.                         |
| 5    | Add the practice card's brief v1 URL. Then edit the brief to v2. Open attachment history and both links.                                                                                                             | v2 is current; v1 remains in history; both URLs open.                          |
| 6    | Reload the job.                                                                                                                                                                                                      | Job ID, survey link, brief URL/history and Pending status remain saved.        |
| 7    | Open `/creator/jobs/LIVE_JOB_ID/invite` (replace the ID). Search for A and B using their exact names from the practice card; select both and confirm sending.                                                        | Two Pending invitations. Existing active invitations cannot be selected again. |

Say only: “The job is saved with its survey and brief. I’ll invite these two marketers.”

Bookmark this live job and `/creator/jobs/LIVE_JOB_ID/offers` now. Do not confuse it with
the prepared backup job. Title, compensation, description and job-form deadline use browser-tab
storage; the backend persists the job/status and survey links. Brief URLs/history persist;
optional brief titles/notes use browser-tab storage. Use the persisted fields as your evidence.

## Part 3 — Offers and hiring (about 5–7 minutes)

Use the **live Job ID** from Part 2 to select invitations in both Marketer windows.

| Step | Browser | Action                                                                                                                                    | Pause and show                                                         |
| ---- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1    | A       | Reload `/marketer/invitations`. Open the live job, expand survey details, and open its brief.                                             | The invitation contains the Creator's saved scope and current brief.   |
| 2    | A       | Accept the invitation and confirm.                                                                                                        | Invitation accepted. The Marketer is not hired yet.                    |
| 3    | A       | Submit an offer for `1200.50`, the delivery date from the practice card, and message `Campus community outreach for 50 students`. Reload. | The offer is saved as Pending with the entered amount.                 |
| 4    | A       | Open `/marketer/offers`, find that live job, withdraw the Pending offer and confirm. Open Withdrawn history.                              | The old proposal remains as Withdrawn.                                 |
| 5    | A       | Resubmit from the latest Withdrawn offer, changing the price to `1100.00`.                                                                | A new Pending offer; the old one remains Withdrawn.                    |
| 6    | B       | Reload invitations, find the same live job, accept, and submit `1500.00` with the suggested delivery date.                                | A second saved proposal for the same job.                              |
| 7    | Creator | Open `/creator/jobs/LIVE_JOB_ID/offers`. Compare the Pending proposals; open marketer details and try price sorting.                      | A's `1100.00` and B's `1500.00`; No ratings yet is handled.            |
| 8    | Creator | Accept A's `1100.00` Pending offer and confirm. Reload.                                                                                   | A is Accepted, B is Rejected, and the selected marketer stays visible. |
| 9    | Creator | Open `/creator/jobs/LIVE_JOB_ID` and reload.                                                                                              | Job status is Accepted. Work has not started.                          |
| 10   | A       | Reload `/marketer/offers`.                                                                                                                | The selected proposal is Accepted and cannot be withdrawn.             |
| 11   | B       | Reload `/marketer/offers`.                                                                                                                | B's competing proposal is Rejected.                                    |
| 12   | A       | Open invitations, select the separate **Decline practice invitation** using the Job ID on the practice card, and decline/confirm.         | It moves to Responded with a declined status.                          |

Say only: “The marketers submit proposals. The Creator compares them and hires one.
The selected offer is accepted, and the competing offer is rejected.”

If time permits, log in as `emptyMarketer` in a separate session and show an empty inbox.
If you want to demonstrate automatic closure of invitations, invite that account to the
live job in Part 2, leave it Pending, then show it Closed after hiring. That account will
no longer demonstrate an empty inbox during this rehearsal.

Stop at Accepted. Starting work, proof, payment and reviews are outside these three epics.

## Practice routine and recovery

1. **First practice:** follow every row slowly. Check the job ID when switching accounts.
2. **Second practice:** run `pnpm setup:sprint2` again; use only the new accounts/card. Time
   the three parts and rehearse browser switches. Keep narration to one sentence per action.
3. **Presentation:** prepare one more fresh run. Sign A/B in beforehand, keep the registration
   account unused, and leave the Creator browser at `/register`. Keep the JSON off-screen.
4. Do not rerun setup halfway through a practice: it creates another dataset rather than
   resetting the current accounts. Continue the current state or deliberately start a new run.
5. To rehearse Part 3 alone, use the card's **backup Job ID**. A accepts/submits/withdraws/
   resubmits; B's `1500.00` offer is already ready, so skip B's submission step. Creator uses
   the **backupComparison** URL. This is a separate prepared scenario, not the job created live.
6. Hiring consumes that scenario. For another hiring rehearsal, create a fresh run. Avoid
   SQL edits or manually changing statuses to rewind it.

This guide is a suggested walkthrough, not a test-pass report. Verify the full sequence on
your running frontend/backend before relying on it for the presentation.
