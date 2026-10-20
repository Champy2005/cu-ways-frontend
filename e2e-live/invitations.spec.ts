import { randomInt, randomUUID } from "node:crypto";
import { test, expect, type Page } from "@playwright/test";

const backendURL = process.env.LIVE_BACKEND_API_URL || "http://127.0.0.1:8081";
type Account = { email: string; password: string; token: string; id: number; marketer: boolean };

// Use native fetch so authentication payloads never enter Playwright API diagnostics.
async function api<T>(path: string, token?: string, body?: unknown): Promise<T> {
  const response = await fetch(`${backendURL}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok)
    throw new Error(`Local fixture API failed: ${response.status} on ${path.split("?")[0]}`);
  return (await response.json()).data as T;
}
async function account(marketer: boolean): Promise<Account> {
  const email = `us2021-${randomUUID()}@example.test`;
  const password = randomUUID();
  const auth = await api<{ access_token: string; user: { user_id: number } }>(
    "/api/v1/auth/register",
    undefined,
    {
      name: "US20/21 synthetic test user",
      email,
      password,
      phone: `09${randomInt(0, 100_000_000).toString().padStart(8, "0")}`,
      ...(marketer
        ? {
            marketer_profile: {
              bio: "Synthetic browser verification",
              experience_years: 0,
              availability_text: "",
            },
          }
        : {}),
    },
  );
  return { email, password, token: auth.access_token, id: auth.user.user_id, marketer };
}
async function signIn(page: Page, user: Account) {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(user.marketer ? /\/marketer\/dashboard$/ : /\/creator\/dashboard$/);
}
async function invite(creator: Account, marketer: Account, surveyId: number) {
  const job = await api<{ job_id: number }>("/api/v1/jobs", creator.token, {
    survey_ids: [surveyId],
  });
  const requests = await api<{ job_request_id: number }[]>(
    `/api/v1/jobs/${job.job_id}/requests`,
    creator.token,
    { marketer_ids: [marketer.id] },
  );
  return { jobId: job.job_id, requestId: requests[0].job_request_id };
}

test("real US20/21: accept, submit, reload, decline, and isolate another marketer", async ({
  page,
  browser,
  baseURL,
}, testInfo) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.name));
  const readiness = await fetch(`${backendURL}/readyz`).catch(() => null);
  expect(readiness?.ok, "Start the migrated local backend before running live tests").toBe(true);
  const creator = await account(false);
  const marketer = await account(true);
  const outsider = await account(true);
  const survey = await api<{ survey_id: number }>("/api/v1/surveys", creator.token, {
    title: "Campus Mobility Study",
    survey_link: "https://example.test/survey",
    description: "Survey metadata for browser verification",
    target_group: "Students",
    desired_responses: 10,
    deadline: "2099-10-28T00:00:00+07:00",
  });
  const first = await invite(creator, marketer, survey.survey_id);
  const second = await invite(creator, marketer, survey.survey_id);
  const additionalSurvey = await api<{ survey_id: number }>("/api/v1/surveys", creator.token, {
    title: "Green Habits 2026",
    survey_link: "https://example.test/green-habits",
    desired_responses: 20,
    deadline: "2099-11-01T00:00:00+07:00",
  });
  await api(`/api/v1/jobs/${first.jobId}/surveys/${additionalSurvey.survey_id}`, creator.token, {});
  await api(`/api/v1/jobs/${first.jobId}/briefs`, creator.token, {
    url: "https://example.test/brief",
  });
  await signIn(page, marketer);
  await page.goto("/marketer/invitations");
  const card = page
    .locator('[data-slot="card"]:visible')
    .filter({ has: page.getByText(`Job #${first.jobId}`, { exact: true }) });
  await expect(
    card.getByRole("heading", {
      name: "Campus Mobility Study + 1 more survey",
      exact: true,
      level: 2,
    }),
  ).toBeVisible();
  await expect(card.locator(".ji-tags > span")).toHaveCount(2);
  await expect(card.getByText(/Job status:|Request status:/)).toHaveCount(0);
  await expect(card.getByRole("link", { name: "Open project brief" })).toHaveAttribute(
    "href",
    "https://example.test/brief",
  );
  await expect(page.getByText(/Creator’s listed budget|fixed|Hi! We noticed/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /refresh invitations|try again/i })).toHaveCount(0);
  if (testInfo.project.name === "mobile") {
    await invite(creator, marketer, survey.survey_id);
    let navigations = 0;
    const onNavigation = () => {
      navigations += 1;
    };
    page.on("framenavigated", onNavigation);
    await page.evaluate(() => window.scrollTo(0, 0));
    const bounds = await page.getByRole("region", { name: "Invitation list" }).boundingBox();
    if (!bounds) throw new Error("Invitation list must be visible for pull-down refresh");
    const client = await page.context().newCDPSession(page);
    const x = bounds.x + bounds.width / 2;
    const y = bounds.y + 12;
    const refreshed = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/job-requests" &&
        response.request().method() === "GET",
    );
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    for (const offset of [25, 50, 90, 130, 160])
      await client.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: y + offset }],
      });
    await expect(page.getByText("Release to refresh", { exact: true })).toBeVisible();
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    expect((await refreshed).status()).toBe(200);
    await expect(page.getByRole("tab", { name: "Pending (3)" })).toBeVisible();
    page.off("framenavigated", onNavigation);
    expect(
      navigations,
      "Pull-down should refresh data without reloading the browser document",
    ).toBe(0);
    await client.detach();
  }
  await card.getByRole("button", { name: "Accept Request" }).click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(card.getByText("Invitation accepted", { exact: true })).toBeVisible();
  await expect(card.getByRole("link", { name: "Submit Offer" })).toHaveClass(/ji-primary/);
  await page.screenshot({ path: testInfo.outputPath("invitations-responded.png"), fullPage: true });
  await card.getByRole("link", { name: "Submit Offer" }).click();
  await page.getByLabel("Proposed Price (THB) *", { exact: true }).fill("9000.50");
  await page.getByLabel("Estimated Delivery *", { exact: true }).fill("2099-10-25");
  await page
    .getByLabel("Message to Creator (Optional)", { exact: true })
    .fill("Synthetic distribution plan");
  await page.getByRole("button", { name: "Submit Offer", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your Offer", exact: true })).toBeVisible();
  await expect(page.locator(".ji-tags > span")).toHaveCount(2);
  await expect(page.getByText(/Job status:|Request status:|Invitation accepted/)).toHaveCount(0);
  const confirmed = await api<{ offered_price: string }[]>(
    `/api/v1/me/job-requests/${first.requestId}/offers`,
    marketer.token,
  );
  expect(confirmed[0]?.offered_price).toBe("9000.50");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Your Offer", exact: true })).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Proposed Price (THB) *", exact: true }),
  ).toHaveValue("9000.50");
  await expect(
    page.getByRole("textbox", { name: "Proposed Price (THB) *", exact: true }),
  ).toHaveAttribute("readonly");
  await expect(page.getByRole("button", { name: /withdraw|resubmit|submit offer/i })).toHaveCount(
    0,
  );
  const projectDetails = page
    .getByText("View project details", { exact: true })
    .filter({ visible: true });
  await projectDetails.press("Enter");
  await expect(page.getByRole("heading", { name: "Green Habits 2026", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open survey", exact: true })).toHaveCount(2);
  await expect(page.getByRole("link", { name: "Open project brief" })).toHaveAttribute(
    "href",
    "https://example.test/brief",
  );
  await projectDetails.press("Enter");
  await expect(page.getByRole("heading", { name: "Green Habits 2026", exact: true })).toHaveCount(
    0,
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath("saved-offer.png"), fullPage: true });
  const offers = await api<
    { offered_price: string; offer_status: string; delivery_date: string; message: string }[]
  >(`/api/v1/me/job-requests/${first.requestId}/offers`, marketer.token);
  expect(offers).toHaveLength(1);
  expect(offers[0]).toMatchObject({
    offered_price: "9000.50",
    offer_status: "Pending",
    delivery_date: "2099-10-25",
    message: "Synthetic distribution plan",
  });
  await page.getByRole("button", { name: "Back to Invitations", exact: true }).click();
  await page.getByRole("tab", { name: /Pending/ }).click();
  const declineCard = page
    .locator('[data-slot="card"]:visible')
    .filter({ has: page.getByText(`Job #${second.jobId}`, { exact: true }) });
  await declineCard.getByRole("button", { name: "Decline", exact: true }).click();
  await page.getByRole("button", { name: "Schedule conflict" }).click();
  await page.getByLabel("Note (optional)").fill("Synthetic decline note");
  await page.getByRole("button", { name: "Decline Request" }).click();
  await expect(declineCard.getByText("Invitation declined", { exact: true })).toBeVisible();
  await page.reload();
  await expect(declineCard.getByText("Schedule conflict. Synthetic decline note")).toBeVisible();
  const requests = await api<
    {
      job_request_id: number;
      request_status: string;
      responded_at: string | null;
      job: { job_status: string };
    }[]
  >("/api/v1/me/job-requests", marketer.token);
  expect(requests.find((item) => item.job_request_id === first.requestId)).toMatchObject({
    request_status: "Accepted",
    job: { job_status: "Pending" },
  });
  expect(
    requests.find((item) => item.job_request_id === second.requestId)?.responded_at,
  ).toBeTruthy();
  const otherContext = await browser.newContext({ baseURL });
  try {
    const other = await otherContext.newPage();
    await signIn(other, outsider);
    await other.goto("/marketer/invitations");
    await expect(
      other.getByRole("heading", { name: "All caught up! No pending requests" }),
    ).toBeVisible();
    await expect(other.getByRole("tabpanel").locator(".ji-empty img")).toHaveCSS(
      "filter",
      "grayscale(1)",
    );
    await expect(other.getByRole("button", { name: /refresh invitations|try again/i })).toHaveCount(
      0,
    );
    await other.screenshot({ path: testInfo.outputPath("empty-inbox.png"), fullPage: true });
    await other.goto(`/marketer/offer/create?requestId=${first.requestId}`);
    await expect(other.getByRole("main").getByRole("alert")).toHaveText(
      "This invitation could not be found.",
    );
    await expect(other.getByRole("button", { name: "Submit Offer" })).toHaveCount(0);
  } finally {
    await otherContext.close();
  }

  await page.goto("/marketer/offers");
  await expect(page.getByRole("heading", { name: "My offers", exact: true })).toBeVisible();
  await expect(page.locator(".mk-navigation-mobile")).toHaveCount(0);
  await expect(
    page.getByRole("searchbox", { name: "Search offers by job or creator" }),
  ).toBeVisible();
  const offerCard = page.locator("article:visible").filter({ hasText: `Job #${first.jobId}` });
  await expect(offerCard.locator('.workspace-status[data-status="Pending"]')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("my-offers-standard.png"), fullPage: true });
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await signIn(page, creator);
  await page.goto("/");
  await expect(page).toHaveURL(/\/creator\/dashboard$/);
  await page.goto("/creator/jobs");
  const jobLink = page.locator(`a[href="/creator/jobs/${first.jobId}"]`);
  await expect(jobLink).toHaveCount(1);
  await expect(jobLink).toContainText("1 pending offer");
  await expect(page.getByRole("link", { name: "Job details", exact: true })).toHaveCount(0);
  await expect(page.locator(".mk-navigation-mobile")).toHaveCount(0);
  if (testInfo.project.name === "mobile") {
    const button = await page
      .getByRole("link", { name: "Create a job", exact: true })
      .boundingBox();
    const header = await page.locator("main section > header").boundingBox();
    expect(button && header && Math.abs(button.width - header.width) < 2).toBeTruthy();
  }
  await page.screenshot({ path: testInfo.outputPath("creator-jobs-standard.png"), fullPage: true });
  await jobLink.click();
  await expect(page.getByRole("heading", { name: "Job details", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "View offers", exact: true })).toHaveClass(
    /mk-primary-button/,
  );
  await page.getByRole("link", { name: "Invite marketers", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Invite Marketers", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Invite Marketers", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Back to job details" })).toHaveCSS(
    "border-top-width",
    "0px",
  );
  if (testInfo.project.name === "mobile") {
    const field = await page
      .getByRole("searchbox", { name: "Search marketers by name, bio, or service" })
      .boundingBox();
    const option = await page
      .locator('input[name="marketer_ids"]')
      .first()
      .locator("..")
      .boundingBox();
    expect(
      field &&
        option &&
        Math.abs(field.x - option.x) < 2 &&
        Math.abs(field.width - option.width) < 2,
    ).toBeTruthy();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: testInfo.outputPath("invite-standard.png"), fullPage: false });
  expect(pageErrors, "Live workflow must not produce uncaught browser errors").toEqual([]);
});
