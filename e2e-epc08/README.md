# EPC-08 Payment & Financial Settlements: automated black-box tests

Playwright tests for EPC-08 (US-029 to US-032). Each test case comes from the
acceptance criteria in the Project Backlog. The tests use the real web app and
the real backend and database, the way a user would.

Each run creates its own new test accounts and job, so you can run it as many
times as you like.

## Test cases

| ID    | Story          | Input / action                                    | Expected result                                                        |
| ----- | -------------- | ------------------------------------------------- | ---------------------------------------------------------------------- |
| TC-01 | US-029         | PromptPay, amount 2,400 (accepted price is 2,500) | Error "The amount must be exactly ฿2,500.00…", nothing recorded        |
| TC-02 | US-029         | No method, amount 2,500                           | Error "Choose a payment method.", nothing recorded                     |
| TC-03 | US-029, US-030 | PromptPay, amount 2,500, confirm                  | "Payment recorded", status Paid, "Recorded on" time; stored in backend |
| TC-04 | US-030         | Reload the page; try to record a second payment   | Paid record still shown; second payment rejected (409)                 |
| TC-05 | US-031         | Job In Progress, paid, but no delivery proof      | No "Complete job" button; backend refuses (409)                        |
| TC-06 | US-031         | Paid and proof added; click Complete job, confirm | "Job completed…"; job status is Completed                              |
| TC-07 | US-032         | Creator opens Transactions                        | Shows Creator, Marketer, accepted price, payment method                |
| TC-08 | US-032         | Hired marketer opens Transactions                 | Shows the same breakdown                                               |
| TC-09 | US-032         | A different creator opens Transactions / the URL  | "No transactions yet"; payment page says "This job is not available"   |

Steps that belong to other epics (register, create job, hire, start job, add
proof) are prepared through the backend API in `fixtures.ts`.

## How to run

1. Start the database (Docker Desktop, container `cuway_container`).
2. Start the backend on its latest `dev` (from `cu-ways-backend`):

   ```bash
   make migrate-up
   make run
   ```

3. In `cu-ways-frontend`, build once, then run the tests:

   ```bash
   pnpm build
   pnpm test:e2e:epc08
   ```

## For a live demo

Show the browser and slow each step down:

```bash
DEMO_SLOWMO=600 pnpm test:e2e:epc08 --headed
```

Step through the tests one by one in Playwright's UI:

```bash
pnpm test:e2e:epc08 --ui
```

Open the HTML report afterwards:

```bash
npx playwright show-report .artifacts/verification/epc08/html
```
