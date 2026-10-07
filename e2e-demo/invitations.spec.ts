import { expect, test } from "@playwright/test";

test("invitation to offer journey, themes, reload, and final withdrawal", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const backendRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/")) backendRequests.push(request.url());
  });
  await page.goto("/demo/marketer?view=invitations");
  await expect(page.getByRole("heading", { name: "Direct Invitations" })).toBeVisible();
  const card = page.locator('[data-slot="card"]').filter({
    has: page.getByRole("heading", { name: "Campus Sustainability Campaign", exact: true }),
  });
  await page.screenshot({ path: testInfo.outputPath("invitations-light.png"), fullPage: true });
  await card.getByRole("button", { name: "Accept Request" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(dialog.locator(":focus")).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath("accept-confirmation.png") });
  await dialog.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Responded (5)" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await card.getByRole("button", { name: "Submit Offer" }).click();
  await expect(page.getByRole("heading", { name: "Submit Your Offer" })).toBeFocused();
  await page.getByLabel("Proposed Price (THB) *").fill("9000");
  await page.getByLabel("Estimated Delivery *").fill("2026-10-25");
  await page
    .getByLabel("Message to Creator (Optional)")
    .fill("Faculty LINE groups and campus outreach.");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath("offer-light.png"), fullPage: true });
  await page.getByRole("button", { name: "Submit Offer", exact: true }).click();
  await expect(page.getByText(/Offer submitted successfully!/)).toBeVisible();
  await page.reload();
  await card.getByRole("button", { name: "View Offer" }).click();
  await expect(page.getByLabel("Proposed Price (THB) *")).toHaveValue("9000.00");
  await page.getByRole("button", { name: /dark/i }).click();
  await expect(page.locator(".marketer-theme")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({ path: testInfo.outputPath("offer-dark.png"), fullPage: true });
  await page.getByRole("button", { name: "Withdraw Offer", exact: true }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Withdraw Offer", exact: true })
    .click();
  await expect(card.getByText("Withdrawn", { exact: true })).toBeVisible();
  await card.getByRole("button", { name: "View Offer" }).click();
  await expect(page.getByText("Offer withdrawn", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit Offer", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Withdraw Offer", exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
  expect(backendRequests).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test("direct link and browser back preserve the correct screen", async ({ page }) => {
  await page.goto("/demo/marketer?view=invitations&tab=responded");
  const card = page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByRole("heading", { name: "Campus Community Research" }) });
  await card.getByRole("button", { name: "Submit Offer" }).click();
  await expect(page.getByRole("heading", { name: "Submit Your Offer" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Campus Community Research" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Direct Invitations" })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Submit Your Offer" })).toBeVisible();
  await page.goto("/demo/marketer?view=offer&requestId=missing");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("could not be found");
});
