# US032: Transaction history

[Open HTML](us-032-transaction-history.html). Read the [shared preview guide](README.md) for setup and the connected flow.

## Routes and entry

Intended routes: `/creator/transactions` and `/marketer/transactions`. Add **Transactions** to each workspace's hamburger menu, using the existing navigation structure. Mark the current destination. A job's completed payment view can also link here.

The role switch changes workspace while keeping the same signed-in account. Creator history shows jobs owned by that Creator. Marketer history shows jobs where that account is the hired Marketer. The fixture account is Alex Kim, with different completed jobs in each role. Other users' jobs never appear.

## Intended design

Follow `/marketer/invitations`: page heading, short description, full-width white search field with the search icon on the right, simple count, and a single column of bordered cards on mobile. At 768px and above, use two equal columns inside the current 1100px list frame. Keep header, gutters, radius, shadow and colors identical to the shared guide.

Each financial breakdown card shows job title, Completed in green text, accepted price in THB, Creator, Marketer, payment method, payout state and completion date. Keep these fields visible without expanding the card. There are no status pills or decorative dashboard charts.

**View payment** opens the same job's recorded details at `/creator/jobs/{id}/payment` or the read-only `/marketer/jobs/{id}/payment`, according to workspace. Only the owning Creator sees **Write a review** or **View review**. An article contains explicit links rather than nesting action links inside a clickable card. All actions have mobile touch targets.

## Behavior

1. Fetch only Completed jobs in which the authenticated user is involved. In the selected workspace, apply the corresponding Creator or hired-Marketer role. Accepted and In Progress jobs with Held payouts remain visible in their job details, not in this completed-job history.
2. Show the accepted price without inventing platform fees or deductions. Show the original recorded payment method. Released means the simulated payout was recorded at job completion, not that a gateway transfer occurred.
3. Search by job title, job number, person or payment method. Reset pagination when the search changes. Counts reflect the filtered result set, not an unrelated total.
4. Order by most recent completion, with a stable job-ID tie-breaker. This prototype paginates at four cards to make the interaction easy to review. That page size is a design fixture, not an API contract.
5. **Next** and **Previous** move through filtered results and disable at the relevant boundary. No pagination is shown for a single page. Preserve keyboard focus after the list updates.
6. The zero-history state explains when records appear and provides a current-job entry point. A search with no matches offers **Clear search**. These are distinct from a loading failure, which provides **Try again**.
7. After payment is recorded, delivery submitted and completion confirmed in US029, the job appears here with the original amount/method and Released payout. Follow its review link to US033 with the same job identifier.

## States and review controls

| State               | Presentation                                                             |
| ------------------- | ------------------------------------------------------------------------ |
| Loading             | Shell stays visible, with a transaction-loading message.                 |
| Completed records   | Breakdown cards, accurate count and conditional pagination.              |
| No completed jobs   | Dedicated empty card with next-step copy.                                |
| No search matches   | Dedicated search state and Clear search action.                          |
| Load failure        | Error card and working Try again action.                                 |
| Creator workspace   | Creator-owned jobs and eligible review actions.                          |
| Marketer workspace  | Jobs hired to this Marketer, payment reading, no Creator review actions. |
| Newly completed job | The record appears with payout Released; reload preserves it.            |

Use **No completed jobs** and **Loading failed** in Prototype controls. Search is live in the normal state. The header theme switch and hamburger work, and the role switch navigates to the other workspace's history. Resetting preview data returns to Creator without changing the chosen theme.

## Developer handoff

Reuse CreatorShell/MarketerShell, SearchField, StatusText, Button and the invitations card layout. Both roles should share one financial-breakdown component. Backend filtering and authorization are mandatory; client-side filtering in the preview demonstrates the intended result only. Production pagination must use server totals/cursors and stable ordering. Map the API's eventual fields to Creator, Marketer, accepted price, method, completion time and agreed Held/Released semantics. No download, date filter or extra financial calculation is implied by this scope.
