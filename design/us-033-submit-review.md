# US033: Submit a review

[Open HTML](us-033-submit-review.html). Read the [shared preview guide](README.md) for setup and the connected flow.

## Route and entry

Intended route: `/creator/jobs/{id}/review`. Enter using **Write a review** from the completed job's details, payment result or transaction card. The plain back arrow returns to that job's details, retaining the job identifier. The standalone prototype represents this parent with the compact job-context view in the payment HTML.

The independent preview starts on completed job #1038. A link from the connected payment/history flow opens the relevant job instead, such as `?job=1042`. Only the owning Creator can submit. The Marketer receives the review on their profile through US034, which is outside this form's design scope.

## Intended design

Reuse the current Creator shell and the same centered form frame and job-summary card as US029. The second card contains a clear heading, the reviewed Marketer's name, a 1 to 5 star input and optional comment. Keep a full-width pink primary action and consistent 48px field/button proportions. Do not add status pills, a floating navigation bar or a circle around the back arrow.

Stars use the existing outline icon language and caution color for the selected rating. Each star has a 44px touch area and a native radio input, with accessible labels and keyboard arrow support. A text value such as **4 out of 5 stars** makes the choice clear without relying on color. The comment is multiline and optional; no unapproved production character limit is invented.

## Behavior

1. Load the job and verify that the current user is its owning Creator, its status is Completed and it has no review.
2. Show an unavailable state for another user or workspace, a missing job, or an incomplete job. For an incomplete job, link back to its payment and delivery context.
3. Require an integer rating from 1 to 5. Do not preselect a score. Missing rating produces an inline error and focuses the first star. Comment is optional and may be submitted empty.
4. Selecting a star fills that star and all preceding stars, updates the textual rating, and clears the missing-rating error. The user can revise the selection before submitting.
5. **Review & submit** opens confirmation with the Marketer, rating and exact comment, or **No written comment**. Explain that the review will appear on the Marketer's profile and that one review can be submitted per job.
6. **Go back** or Escape returns to the form with its rating and comment intact. **Submit review** shows Submitting and prevents duplicate confirmation while saving.
7. A save failure stays in the dialog, retains the full draft and allows retry. Success shows one top-slide toast and replaces the form with the saved rating, comment and submission date.
8. Reopening or reloading the page shows the existing review. History and job details now say **View review**. There is no second submission, edit or delete action in this scope.

Treat review comments as text when rendering. The preview escapes HTML-like input, preserves line breaks and wraps long words. Confirmation content scrolls for a long comment and stays within the mobile viewport. Dialog focus returns to the form action on cancel, or to the updated main region on success. Reduced motion disables toast animation.

## States to implement

| State                       | Presentation                                                    |
| --------------------------- | --------------------------------------------------------------- |
| Loading                     | Shared shell with a review-loading message.                     |
| Ready                       | Completed job summary, no preselected rating, optional comment. |
| Missing rating              | Inline error and focus on the rating input.                     |
| Confirmation                | Review summary with Go back and Submit review.                  |
| Saving                      | Pending label; no duplicate submit or dismissal during save.    |
| Save failure                | Error in the dialog, preserved draft and retry.                 |
| Submitted                   | Read-only rating/comment/date and Back to transactions.         |
| Already reviewed            | Same saved-review view with no second form.                     |
| Incomplete job              | Explain completion requirement and link to the job context.     |
| Unauthorized or missing job | Clear unavailable state with navigation back to history.        |

Prototype controls include Completed, Review already submitted, incomplete states, restricted Creator actions and **Fail the next save**. They alter fictional records only.

## Developer handoff

Reuse CreatorShell, BackLink, Button, the existing textarea and SuccessToast. Share the saved-rating treatment with US034 when that public-profile design is ready. Backend authorization must enforce owning Creator, Completed status, valid rating and a unique review per job. Derive the reviewed Marketer from the job's accepted offer, not a user-editable field. Enforce uniqueness transactionally so simultaneous tabs cannot submit twice. Confirmation and disabled buttons alone are not the security or consistency boundary.
