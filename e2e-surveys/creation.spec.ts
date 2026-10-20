import { randomInt, randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";

const backendURL = process.env.LIVE_BACKEND_API_URL || "http://127.0.0.1:8081";
test("create, reload, list and select a persisted survey; isolate ownership", async ({
  page,
  browser,
  baseURL,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.name));
  // Native fetch keeps synthetic credentials out of Playwright API diagnostics.
  const email = `survey-${randomUUID()}@example.test`;
  const password = randomUUID();
  const registration = await fetch(`${backendURL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Survey browser verification",
      email,
      password,
      phone: `09${randomInt(0, 100_000_000).toString().padStart(8, "0")}`,
    }),
  });
  expect(registration.status).toBe(201);
  const auth = (await registration.json()).data;
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/creator\/dashboard$/);
  await page.getByRole("link", { name: "Manage surveys" }).click();
  await expect(page.getByRole("heading", { name: "No surveys yet" })).toBeVisible();
  await page.getByRole("link", { name: "Create Survey", exact: true }).click();
  const title = `Campus study ${testInfo.project.name}`;
  await page.getByLabel("Title", { exact: false }).fill(title);
  await page.getByLabel(/Survey URL/).fill("https://example.test/campus-survey");
  await page.getByLabel(/Description/).fill("Survey metadata only.");
  await page.getByLabel(/Target Demographic/).fill("University students");
  await page.getByLabel(/Desired Responses/).fill("100");
  await page.getByLabel(/Deadline/).fill("2026-12-31");
  await page.getByRole("button", { name: "Create Survey", exact: true }).click();
  await expect(page).toHaveURL(/\/surveys\/\d+$/);
  const id = Number(new URL(page.url()).pathname.split("/").at(-1));
  expect(Number.isInteger(id) && id > 0).toBe(true);
  await expect(
    page.getByRole("status").filter({ hasText: "Survey created successfully." }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("status").filter({ hasText: "Survey created successfully." }),
  ).toHaveCount(0);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(
    page.getByText("2026-12-31", { exact: true }).filter({ visible: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: testInfo.outputPath("saved-survey.png"), fullPage: true });
  const records = await fetch(`${backendURL}/api/v1/me/surveys`, {
    headers: { Authorization: `Bearer ${auth.access_token}` },
  });
  const surveys = (await records.json()).data;
  expect(surveys).toHaveLength(1);
  expect(surveys[0]).toMatchObject({
    survey_id: id,
    title,
    desired_responses: 100,
    target_group: "University students",
    deadline: "2026-12-31T00:00:00Z",
  });
  await page.getByRole("link", { name: "Back to My surveys" }).click();
  await expect(page.getByRole("link", { name: title })).toBeVisible();
  await page.getByRole("link", { name: "Create a job with your surveys" }).click();
  await page.getByRole("button", { name: "Edit selected surveys", exact: true }).click();
  await expect(page.getByText(title, { exact: true })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: new RegExp(title) })).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("survey-in-job-selector.png"),
    fullPage: true,
  });
  // A different real account cannot read the owner's record.
  const outsider = await fetch(`${backendURL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Other survey creator",
      email: `survey-${randomUUID()}@example.test`,
      password: randomUUID(),
      phone: `09${randomInt(0, 100_000_000).toString().padStart(8, "0")}`,
    }),
  });
  expect(outsider.status).toBe(201);
  const other = (await outsider.json()).data;
  const denied = await fetch(`${backendURL}/api/v1/surveys/${id}`, {
    headers: { Authorization: `Bearer ${other.access_token}` },
  });
  expect(denied.status).toBe(403);
  const signedOut = await browser.newContext({ baseURL });
  const anonymous = await signedOut.newPage();
  await anonymous.goto("/surveys/new");
  await expect(anonymous).toHaveURL(/\/login/);
  await signedOut.close();
  expect(errors).toEqual([]);
});
