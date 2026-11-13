import { randomInt, randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

const backendURL = process.env.LIVE_BACKEND_API_URL || "http://127.0.0.1:8081";
test.use({ actionTimeout: 10_000 });

async function api<T>(path: string, token?: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(`${backendURL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok)
    throw new Error(`Fixture API returned ${response.status} for ${method} ${path}`);
  return (await response.json()).data as T;
}

async function createAccount(marketer: boolean) {
  const email = `us32-${randomUUID()}@example.test`;
  const password = randomUUID();
  const auth = await api<{ access_token: string; user: { user_id: number } }>(
    "/api/v1/auth/register",
    undefined,
    "POST",
    {
      email,
      password,
      name: marketer ? "US32 Marketer" : "US32 Creator",
      phone: `09${randomInt(100_000_000).toString().padStart(8, "0")}`,
      ...(marketer
        ? {
            marketer_profile: {
              bio: "Synthetic delivery workflow",
              experience_years: 0,
              availability_text: "",
            },
          }
        : {}),
    },
  );
  return { email, password, token: auth.access_token, id: auth.user.user_id };
}

async function signIn(page: Page, account: Awaited<ReturnType<typeof createAccount>>) {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/(creator|marketer)\/dashboard$/);
}

async function createAcceptedJob(
  creator: Awaited<ReturnType<typeof createAccount>>,
  marketer: Awaited<ReturnType<typeof createAccount>>,
) {
  const survey = await api<{ survey_id: number }>("/api/v1/surveys", creator.token, "POST", {
    title: "Campus mobility survey",
    survey_link: "https://example.test/survey",
    deadline: "2099-10-28T00:00:00+07:00",
  });
  const { job_id: jobId } = await api<{ job_id: number }>("/api/v1/jobs", creator.token, "POST", {
    title: "Campus mobility delivery",
    survey_ids: [survey.survey_id],
    deadline: "2099-10-28",
  });
  const jobApi = `/api/v1/jobs/${jobId}`;
  await api(`${jobApi}/briefs`, creator.token, "POST", { url: "https://example.test/brief" });
  const [request] = await api<{ job_request_id: number }[]>(
    `${jobApi}/requests`,
    creator.token,
    "POST",
    {
      marketer_ids: [marketer.id],
    },
  );
  const requestApi = `/api/v1/me/job-requests/${request.job_request_id}`;
  await api(`${requestApi}/accept`, marketer.token, "POST");
  const { offer_id: offerId } = await api<{ offer_id: number }>(
    `${requestApi}/offers`,
    marketer.token,
    "POST",
    {
      offered_price: "2500.00",
      delivery_date: "2099-10-25",
    },
  );
  await api(`${jobApi}/offers/${offerId}/accept`, creator.token, "POST");
  return { jobId, jobApi };
}

test("US032 shows completed paid jobs and linked records to both participants", async ({
  page,
  browser,
  baseURL,
}) => {
  const creator = await createAccount(false);
  const marketer = await createAccount(true);
  const { jobId } = await createAcceptedJob(creator, marketer);

  const marketerContext = await browser.newContext({
    baseURL,
    viewport: page.viewportSize() ?? undefined,
    userAgent: await page.evaluate(() => navigator.userAgent),
  });
  marketerContext.setDefaultTimeout(10_000);
  try {
    const marketerPage = await marketerContext.newPage();
    await signIn(page, creator);
    await page.goto("/creator/transactions");
    await expect(page.getByRole("heading", { name: "No transactions yet" })).toBeVisible();

    await page.goto(`/creator/jobs/${jobId}/review`);
    await expect(
      page
        .locator("main")
        .getByText("You can review the Marketer after the job is completed.", { exact: true }),
    ).toBeVisible();

    await page.goto(`/creator/jobs/${jobId}`);
    await expect(
      page
        .getByRole("region", { name: "Marketer contact" })
        .getByRole("link", { name: marketer.email }),
    ).toHaveAttribute("href", `mailto:${marketer.email}`);
    await page.getByRole("link", { name: "Record payment" }).first().click();
    await page.getByRole("radio", { name: "PromptPay", exact: true }).check();
    await page.getByLabel(/Amount/).fill("2500");
    await page.getByRole("button", { name: "Review payment" }).click();
    await page.getByRole("button", { name: "Confirm record" }).click();
    await expect(page.getByText("Paid", { exact: true }).first()).toBeVisible();

    await signIn(marketerPage, marketer);
    await marketerPage.goto("/marketer/offers");
    await marketerPage.getByRole("link", { name: "View job", exact: true }).click();
    const marketerJob = marketerPage.getByRole("main");
    await expect(marketerJob.getByRole("link", { name: /Campus mobility survey/ })).toHaveAttribute(
      "href",
      "https://example.test/survey",
    );
    await expect(marketerJob.getByRole("link", { name: /Open brief/ })).toHaveAttribute(
      "href",
      "https://example.test/brief",
    );
    await expect(
      marketerJob
        .getByRole("region", { name: "Creator contact" })
        .getByRole("link", { name: creator.email }),
    ).toHaveAttribute("href", `mailto:${creator.email}`);
    await marketerPage.getByRole("button", { name: "Start job", exact: true }).click();
    await marketerPage
      .getByRole("dialog")
      .getByRole("button", { name: "Start job", exact: true })
      .click();
    await expect(marketerPage.getByText("In Progress", { exact: true })).toBeVisible();
    await marketerPage.getByLabel("Proof link").fill("https://example.test/delivery");
    await marketerPage.getByRole("button", { name: "Submit proof" }).click();
    await marketerPage.getByRole("button", { name: "Confirm proof" }).click();
    await expect(marketerPage.getByRole("link", { name: /example\.test\/delivery/ })).toBeVisible();

    await page.getByRole("link", { name: "Back to job details", exact: true }).first().click();
    await expect(page.getByRole("link", { name: /Open delivery proof/ })).toHaveAttribute(
      "href",
      "https://example.test/delivery",
    );
    await page.getByRole("button", { name: "Complete job" }).click();
    await page.getByRole("button", { name: "Confirm completion" }).click();
    await expect(page.getByText("Released", { exact: true }).first()).toBeVisible();
    await page.goto("/creator/transactions");
    const creatorCard = page.getByRole("article");
    await expect(creatorCard.getByText("Released", { exact: true })).toBeVisible();
    await expect(creatorCard.locator("time")).toBeVisible();
    await page.getByRole("searchbox").fill(`#${jobId}`);
    await expect(page).toHaveURL(/keyword=/);
    await expect(creatorCard).toHaveCount(1);
    await creatorCard.getByRole("link", { name: "Write a review" }).click();
    await page.getByRole("radio", { name: "5 stars" }).focus();
    await page.keyboard.press("Space");
    await page.getByLabel("Comment (optional)").fill("Delivery was clear and complete.");
    await page.getByRole("button", { name: "Review & submit" }).click();
    await page.getByRole("button", { name: "Submit review" }).click();
    await expect(page.getByRole("heading", { name: "Review submitted" })).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("main").getByText("Delivery was clear and complete.", { exact: true }),
    ).toBeVisible();
    await page.goto("/creator/transactions");
    await page.getByRole("article").getByRole("link", { name: "View review" }).click();
    await expect(page.getByRole("heading", { name: "Review submitted" })).toBeVisible();
    await page.goto("/creator/transactions");
    await page.getByRole("article").getByRole("link", { name: "View payment" }).click();
    await expect(page).toHaveURL(`/creator/jobs/${jobId}/payment`);
    const recordedPayment = page.getByRole("region", { name: "Payment recorded", exact: true });
    await expect(recordedPayment.getByText("Paid", { exact: true })).toBeVisible();
    await expect(recordedPayment.getByText("PromptPay", { exact: true })).toBeVisible();

    await marketerPage.goto("/marketer/transactions");
    const marketerCard = marketerPage.getByRole("article");
    await expect(marketerCard.getByText("Released", { exact: true })).toBeVisible();
    await expect(marketerCard.getByRole("link", { name: /review/i })).toHaveCount(0);
    await marketerCard.getByRole("link", { name: "View payment" }).click();
    await marketerPage.reload();
    const paymentDetails = marketerPage.getByRole("main");
    await expect(paymentDetails.getByText("PromptPay", { exact: true })).toBeVisible();
    await expect(paymentDetails.getByText("Released", { exact: true })).toBeVisible();
    await expect(
      marketerPage.getByRole("button", { name: /record payment|complete job/i }),
    ).toHaveCount(0);
  } finally {
    await marketerContext.close();
  }
});

test("US034 shows verified reviews to the marketer who received them", async ({ page }) => {
  const creator = await createAccount(false);
  const marketer = await createAccount(true);
  const { jobId, jobApi } = await createAcceptedJob(creator, marketer);
  const performanceURL = `/marketers/${marketer.id}/verified-performance`;

  await signIn(page, marketer);
  await page.goto(performanceURL);
  await expect(page.getByRole("heading", { name: "No ratings yet" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "No reviews yet" })).toBeVisible();

  await api(`${jobApi}/payments`, creator.token, "POST", {
    method: "PromptPay",
    amount: "2500.00",
  });
  await api(`${jobApi}/start`, marketer.token, "POST");
  await api(`${jobApi}/proofs`, marketer.token, "POST", { url: "https://example.test/delivery" });
  await api(`${jobApi}/complete`, creator.token, "POST");
  const comment = "Delivery was clear and complete.";
  await api(`${jobApi}/reviews`, creator.token, "POST", { rating: 5, comment });

  await page.reload();
  const reviews = page.getByRole("region", { name: "Verified reviews" });
  await expect(reviews.getByText("5.00", { exact: true })).toBeVisible();
  await expect(reviews.getByText("US32 Creator", { exact: true })).toBeVisible();
  await expect(reviews.getByText(comment, { exact: true })).toBeVisible();
  await expect(reviews.getByText(`Job #${jobId}`, { exact: true })).toBeVisible();
  await reviews.getByLabel("Filter by rating").selectOption("1");
  await expect(page).toHaveURL(/rating=1/);
  await expect(reviews.getByText("No reviews match this rating", { exact: true })).toBeVisible();
});
