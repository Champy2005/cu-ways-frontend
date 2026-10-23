# US029: Record a payment

[Open HTML](us-029-payment-recording.html). Read the [shared preview guide](README.md) for setup, the agreed payment flow and scenario controls.

## Route and entry

Intended route: `/creator/jobs/{id}/payment`. Enter from the accepted job's details using **Record payment**. The plain back arrow returns to that same job, preserving its ID. The standalone HTML uses `?job=1042`, and its compact `&view=job` context represents the parent page. Production should use the existing full job-details page.

After recording, the same route becomes **Payment details**, avoiding duplicate payment entry. An involved Marketer may read their job's recorded payment and payout state at the proposed companion route `/marketer/jobs/{id}/payment`; they cannot record payment or complete the job. The Marketer workspace's history links to this read-only variant. Its back destination is `/marketer/jobs/{id}`. Both variants share this HTML layout, with the workspace determining the available actions. The Creator payment-writing route remains Creator-only.

## Intended design

Use the current Creator shell, plain back arrow and centered 448px form frame. On mobile it fills the available width within the existing workspace gutters. The upper card gives the job title, status, Creator, selected Marketer and accepted price. The lower card uses the existing offer-form language: section heading, white fields, clear labels and one full-width pink primary action.

Three native radio rows represent PromptPay, Bank Transfer and Credit Card. Their selection outline is a form affordance, not a status pill. No method is preselected. The amount is an editable decimal field with THB and the accepted-price hint. Do not collect card numbers, bank details or account credentials. The no-money-movement explanation is visible beside the main action and in the confirmation.

Status words are plain colored text. Paid is green; Held is yellow; Released is green; In Progress is blue. Cards share the same shadow. There is no permanent circle around the back arrow and no bottom navigation. Dark mode uses the existing workspace palette.

## Behavior

1. Load the owning Creator's job and the specific Accepted offer. Payment is available for an Accepted or In Progress job with that offer.
2. Require a payment method and a positive amount, with up to two decimals, exactly equal to the accepted offer price. Empty, malformed, negative, zero and mismatched values show inline errors. Error text identifies the correction. Focus moves to the first invalid field.
3. **Review payment** opens a confirmation containing the Marketer, selected method, exact amount and held-payout explanation. **Go back** or Escape preserves all entered values.
4. **Confirm record** shows Recording, disables duplicate submission and records one Paid payment with a timestamp. Payout becomes Held. It leaves the existing job status unchanged. Show one top-slide success toast, then the persistent payment record.
5. Replace the editable form with a read-only breakdown and the delivery checklist. Refreshing does not create another record or replay the toast. Recorded method, amount and timestamp are not editable here.
6. The Marketer's separate US025/US026 flow starts the job and submits proof. **Delivery submitted** in the prototype controls simulates those external steps. Its proof link uses an example page. This is not the production proof submission UI.
7. **Complete job** becomes available only for the owning Creator when the job is In Progress, the same job has its Accepted offer, payment is Paid for the accepted price, payout is Held, and proof exists. The Creator must open and inspect the proof before deciding to confirm; opening the link alone does not prove acceptance or alter state.
8. Confirmation explains that completing the job also releases its recorded payout. On success, update Completed, completion time, Released and release time together. Preserve the original payment and accepted offer. Show one success toast, then links to Transactions and Write a review.

The completion control is included to demonstrate the agreed connection to payment and payout. In the implemented product, use the job-detail completion action from US027/US031 as the primary entry point and show the same payment requirements and confirmation there. Do not create competing completion flows with different rules.

## States to implement

| State                                | Behavior                                                                               |
| ------------------------------------ | -------------------------------------------------------------------------------------- |
| Loading                              | Keep the shell and indicate that payment details are loading.                          |
| No accepted offer                    | Explain why payment is unavailable; no write form.                                     |
| Missing job                          | Show a clear unavailable state with navigation to history.                             |
| Another Creator or unauthorized user | Do not show the payment-writing or completion actions. Server must enforce this.       |
| Invalid fields                       | Inline errors; preserve the valid entries.                                             |
| Confirmation cancelled               | Restore focus to Review payment; retain values.                                        |
| Saving                               | Disable both dialog actions and prevent Escape until the save settles.                 |
| Save failure                         | Explain failure inside the dialog; preserve method and amount; allow retry or Go back. |
| Paid / Held                          | Show immutable recorded details and delivery requirements.                             |
| Proof missing or job not In Progress | Disable Complete job and explain what is missing.                                      |
| Completed / Released                 | Show the result and the eligible review entry point.                                   |
| Record changed elsewhere             | Recheck eligibility before saving and prevent a second payment or release.             |

Use **Fail the next save** to inspect retry, and state presets for accepted/unpaid, held, delivery submitted, completed, already reviewed and restricted actions. Those controls only manipulate fictional preview data.

## Backend handoff

The backlog describes a Paid payment and immutable history. Separate Held/Released payout recording is the user's agreed extension. Production needs authoritative amount comparison in integer minor units or decimal money, accepted-offer ownership checks, one payment per job, immutable Paid timestamps, access control and atomic completion/release. Browser checks are illustrative only. Do not implement real collection or payout, assume fees, or infer cancellation/refund policy from this preview.
