import { expect, test, type Browser, type Page } from "@playwright/test";
import {
  addProof,
  api,
  apiStatus,
  createAcceptedJob,
  createAccount,
  signIn,
  startJob,
  type Account,
} from "./fixtures";

/**
 * EPC-08 Payment & Financial Settlements — automated black-box tests.
 *
 * Every test case comes from the acceptance criteria in the Project Backlog
 * (US-029 to US-032). The tests only use what a user sees and does in the
 * browser, plus the public API to confirm what was stored. They run in order
 * because they follow one job from payment to the transaction history.
 */

const ACCEPTED_PRICE = "2500.00";
const PRICE_TEXT = "฿2,500.00";
/** Transactions shows "THB 2,500.00" and the payment page "฿2,500.00"; both are the accepted price. */
const PRICE_NUMBER = /2,500\.00/;

let creator: Account;
let marketer: Account;
let outsider: Account;
let jobId: number;
let jobTitle: string;

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  creator = await createAccount("creator", "Creator");
  marketer = await createAccount("marketer", "Marketer");
  outsider = await createAccount("creator", "Outsider");
  ({ jobId, title: jobTitle } = await createAcceptedJob(creator, marketer, ACCEPTED_PRICE));
});

async function openAs(browser: Browser, account: Account): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await signIn(page, account);
  return page;
}

function paymentForm(page: Page) {
  return {
    method: (name: string) => page.getByRole("radio", { name }),
    amount: page.getByRole("textbox", { name: /Amount/ }),
    review: page.getByRole("button", { name: "Review payment" }),
  };
}

async function currentPayment() {
  return (
    await api<{ payment: Record<string, string> | null }>(
      `/api/v1/jobs/${jobId}/payments/current`,
      creator.token,
    )
  ).payment;
}

test.describe("EPC-08 Payment & Financial Settlements", () => {
  test("TC-01 (US-029): a wrong amount shows an error and records nothing", async ({ browser }) => {
    const page = await openAs(browser, creator);
    await page.goto(`/creator/jobs/${jobId}/payment`);
    const form = paymentForm(page);

    await form.method("PromptPay").check();
    await form.amount.fill("2400");
    await form.review.click();

    await expect(
      page.getByText(`The amount must be exactly ${PRICE_TEXT}, the accepted offer price.`),
    ).toBeVisible();
    await expect(page.getByRole("alertdialog", { name: "Record this payment?" })).toHaveCount(0);
    expect(await currentPayment()).toBeNull();
  });

  test("TC-02 (US-029): no payment method chosen shows an error", async ({ browser }) => {
    const page = await openAs(browser, creator);
    await page.goto(`/creator/jobs/${jobId}/payment`);
    const form = paymentForm(page);

    await form.amount.fill("2500");
    await form.review.click();

    await expect(page.getByText("Choose a payment method.")).toBeVisible();
    await expect(page.getByRole("alertdialog", { name: "Record this payment?" })).toHaveCount(0);
    expect(await currentPayment()).toBeNull();
  });

  test("TC-03 (US-029, US-030): the exact amount records a Paid payment with a timestamp", async ({
    browser,
  }) => {
    const page = await openAs(browser, creator);
    await page.goto(`/creator/jobs/${jobId}/payment`);
    const form = paymentForm(page);

    await form.method("PromptPay").check();
    await form.amount.fill("2500");
    await form.review.click();

    const dialog = page.getByRole("alertdialog", { name: "Record this payment?" });
    await expect(dialog).toContainText(marketer.name);
    await expect(dialog).toContainText("PromptPay");
    await expect(dialog).toContainText(PRICE_TEXT);
    await dialog.getByRole("button", { name: "Confirm record" }).click();

    const record = page.getByRole("region", { name: "Payment recorded" });
    await expect(record).toBeVisible();
    await expect(record).toContainText("PromptPay");
    await expect(record).toContainText("Paid");
    await expect(record).toContainText("Recorded on");

    const saved = await currentPayment();
    expect(saved).toMatchObject({
      method: "PromptPay",
      amount: ACCEPTED_PRICE,
      payment_status: "Paid",
    });
    expect(saved?.paid_at).toBeTruthy();
  });

  test("TC-04 (US-030): the Paid record is kept after a reload and cannot be recorded twice", async ({
    browser,
  }) => {
    const page = await openAs(browser, creator);
    await page.goto(`/creator/jobs/${jobId}/payment`);
    await page.reload();

    await expect(page.getByRole("region", { name: "Payment recorded" })).toContainText("Paid");
    await expect(paymentForm(page).review).toHaveCount(0);

    const second = await apiStatus(`/api/v1/jobs/${jobId}/payments`, creator.token, "POST", {
      method: "Bank Transfer",
      amount: ACCEPTED_PRICE,
    });
    expect(second.status).toBe(409);
  });

  test("TC-05 (US-031): the job cannot be completed before delivery proof exists", async ({
    browser,
  }) => {
    await startJob(marketer, jobId);
    const page = await openAs(browser, creator);
    await page.goto(`/creator/jobs/${jobId}`);

    await expect(page.getByText("In Progress", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Complete job" })).toHaveCount(0);

    const attempt = await apiStatus(`/api/v1/jobs/${jobId}/complete`, creator.token, "POST");
    expect(attempt).toEqual({ status: 409, code: "completion_proof_required" });
  });

  test("TC-06 (US-031): with Paid payment and proof, the creator completes the job", async ({
    browser,
  }) => {
    await addProof(marketer, jobId);
    const page = await openAs(browser, creator);
    await page.goto(`/creator/jobs/${jobId}`);

    await page.getByRole("button", { name: "Complete job" }).click();
    await page.getByRole("button", { name: "Confirm completion" }).click();

    await expect(page.getByText("Job completed. Payout recorded as Released.")).toBeVisible();
    const job = await api<{ job_status: string }>(`/api/v1/jobs/${jobId}`, creator.token);
    expect(job.job_status).toBe("Completed");
  });

  test("TC-07 (US-032): the creator sees the financial breakdown in Transactions", async ({
    browser,
  }) => {
    const page = await openAs(browser, creator);
    await page.goto("/creator/transactions");

    const card = page.getByRole("article").filter({ hasText: jobTitle });
    await expect(card).toContainText(creator.name);
    await expect(card).toContainText(marketer.name);
    await expect(card).toContainText(PRICE_NUMBER);
    await expect(card).toContainText("PromptPay");
  });

  test("TC-08 (US-032): the hired marketer sees the same breakdown", async ({ browser }) => {
    const page = await openAs(browser, marketer);
    await page.goto("/marketer/transactions");

    const card = page.getByRole("article").filter({ hasText: jobTitle });
    await expect(card).toContainText(creator.name);
    await expect(card).toContainText(marketer.name);
    await expect(card).toContainText(PRICE_NUMBER);
    await expect(card).toContainText("PromptPay");
  });

  test("TC-09 (US-032): a user who is not part of the job cannot see its payment", async ({
    browser,
  }) => {
    const page = await openAs(browser, outsider);
    await page.goto("/creator/transactions");
    await expect(page.getByRole("heading", { name: "No transactions yet" })).toBeVisible();
    await expect(page.getByText(jobTitle)).toHaveCount(0);

    await page.goto(`/creator/jobs/${jobId}/payment`);
    await expect(page.getByText("This job is not available")).toBeVisible();
    await expect(page.getByText(PRICE_NUMBER)).toHaveCount(0);
  });
});
